"use client";

// Extend the Navigator interface to include 'bluetooth'
declare global {
  interface Navigator {
    bluetooth: any;
  }
}

import React, { createContext, useContext, useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { useAuth } from "./AuthContext";

type Device = {
  id: number;
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
};

type ActiveDeviceResponse = {
  deviceId: number;
  deviceName: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
  registeredDevice?: boolean;
};

type BluetoothDeviceContextType = {
  devices: Device[];
  activeDeviceId: string;
  isRegistered: boolean | null;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  isLayoutLoading: boolean;
  handleDeviceSelect: (deviceId: string) => Promise<void>;
  scanForDevices: () => Promise<void>;
  currentDeviceBLE: BluetoothDevice | null;
  showRegisterModal: boolean;
  setShowRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  saveDevice: (deviceName: string) => Promise<void>;
  showCreateModal: boolean;
  registerDevice: () => Promise<void>;
  form: any;
  isScanning: boolean;
  localConnected: boolean;
  isRegistering: boolean;
  refreshDevices: () => Promise<void>;
  showDeleteModal: boolean;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  deleteDevice: () => Promise<void>;
};

type BluetoothDevice = {
  id: string;
  gatt?: any; // Provided by the DOM lib, fallback to 'any' if type is missing
};

const BluetoothDeviceContext = createContext<
  BluetoothDeviceContextType | undefined
>(undefined);

export const useBluetoothDevice = () => {
  const context = useContext(BluetoothDeviceContext);
  if (!context)
    throw new Error(
      "useBluetoothDevice must be used within a BluetoothDeviceProvider"
    );
  return context;
};

export const BluetoothDeviceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [deviceSelectionTrigger, setDeviceSelectionTrigger] = useState(0);
  const [page, setPage] = useState(1);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [currentDeviceBLE, setCurrentDeviceBLE] =
    useState<BluetoothDevice | null>(null);
  const [form, setForm] = useState({
    serviceUuid: "",
    measurementCharUuid: "",
    logReadCharUuid: "",
    setTimeCharUuid: "",
    ledControlCharUuid: "",
    sleepControlCharUuid: "",
    alarmCharUuid: "",
  });
  const [isScanning, setIsScanning] = useState(false);
  const [localConnected, setLocalConnected] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { token } = useAuth();

  // Fetch active device
  const fetchActiveDevice = async () => {
    if (!token) return; // 🚀 don’t call API without token
    try {
      const res = await fetch(`${API_BASE_URL}/api/device/active`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch active device");
      const data: ActiveDeviceResponse = await res.json();
      setIsRegistered(!!data.registeredDevice);
      setActiveDeviceId(data.deviceId?.toString() || "");
    } catch (error) {
      console.error(error);
      setIsRegistered(false);
    } finally {
      setIsLayoutLoading(false);
    }
  };

  // Fetch devices
  const fetchDevices = async () => {
    if (!token) return; // 🚀 don’t call API without token
    try {
      const res = await fetch(`${API_BASE_URL}/api/device/list`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data: Device[] = await res.json();
      setDevices(data || []);
    } catch (err) {
      console.error(err);
      addToast({
        title: "Error",
        description: "Failed to load devices",
        color: "danger",
      });
      setDevices([]);
    }
  };
  useEffect(() => {
    if (token) {
      fetchActiveDevice();
      fetchDevices();
    }
  }, [token]);

  // Keep your deviceSelectionTrigger effect as is
  useEffect(() => {
    if (token) {
      fetchDevices();
    }
  }, [deviceSelectionTrigger, token]);

  const handleDeviceSelect = async (deviceId: string) => {
    try {
      setIsSelecting(true);
      setIsLayoutLoading(true);
      setActiveDeviceId(deviceId);

      const res = await fetch(
        `${API_BASE_URL}/api/device/select?deviceId=${deviceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to set active device");

      setDeviceSelectionTrigger((prev) => prev + 1);
      await fetchActiveDevice();
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "Error",
        description: err.message || "Failed to select device",
        color: "danger",
      });
    } finally {
      setIsSelecting(false);
    }
  };

  useEffect(() => {
    if (devices.length > 0 && page <= devices.length) {
      const currentDevice = devices[page - 1];
      if (currentDevice && currentDevice.id.toString() !== activeDeviceId) {
        handleDeviceSelect(currentDevice.id.toString());
      }
    }
  }, [page, devices]);

  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "11111111-1111-1111-1111-111111111111",
          "22222222-2222-2222-2222-222222222222",
          "33333333-3333-3333-3333-333333333333",
          "44444444-4444-4444-4444-444444444444",
          "55555555-5555-5555-5555-555555555555",
          "66666666-6666-6666-6666-666666666666",
          "77777777-7777-7777-7777-777777777777",
        ],
      });
      setCurrentDeviceBLE(device);
      if (device.gatt) {
        await device.gatt.connect();
        setLocalConnected(true);
        await discoverServices(device);
      }
    } catch (err: any) {
      console.error(err);
      addToast({
        title: err?.message || "Connection failed",
        color: "warning",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const deleteDevice = async () => {
    const activeDevice = devices.find(
      (d) => d.id.toString() === activeDeviceId
    );

    if (!activeDevice?.id) {
      addToast({ title: "No active device to delete", color: "warning" });
      return;
    }

    try {
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(
        `${API_BASE_URL}/api/device/list/${activeDevice.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to delete device");

      addToast({ title: "Device deleted successfully", color: "success" });

      // Refresh device list
      const updatedDevicesRes = await fetch(`${API_BASE_URL}/api/device/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!updatedDevicesRes.ok) throw new Error("Failed to fetch devices");
      const updatedDevices: Device[] = await updatedDevicesRes.json();
      setDevices(updatedDevices);

      // ✅ If the deleted device was active, set a new active device
      if (updatedDevices.length > 0) {
        setActiveDeviceId(updatedDevices[0].id.toString());
        await handleDeviceSelect(updatedDevices[0].id.toString());
      } else {
        // No devices left
        setActiveDeviceId("");
      }
    } catch (err) {
      console.error(err);
      addToast({ title: "Error deleting device", color: "danger" });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const discoverServices = async (device: BluetoothDevice) => {
    try {
      if (!device.gatt) throw new Error("GATT not available");
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      const mappedForm = { ...form };
      for (const service of services) {
        if (service.uuid.includes("1111"))
          mappedForm.serviceUuid = service.uuid;
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.uuid.includes("2222"))
            mappedForm.measurementCharUuid = char.uuid;
          if (char.uuid.includes("4444"))
            mappedForm.setTimeCharUuid = char.uuid;
          if (char.uuid.includes("5555"))
            mappedForm.sleepControlCharUuid = char.uuid;
          if (char.uuid.includes("6666"))
            mappedForm.ledControlCharUuid = char.uuid;
          if (char.uuid.includes("7777"))
            mappedForm.logReadCharUuid = char.uuid;
          if (char.uuid.includes("3333")) mappedForm.alarmCharUuid = char.uuid;
        }
      }
      setForm(mappedForm);
      setShowRegisterModal(true);
      addToast({ title: "Service discovery complete", color: "success" });
    } catch (err) {
      console.error(err);
      addToast({ title: "Service discovery failed", color: "danger" });
    }
  };

  const registerDevice = async () => {
    try {
      setIsRegistering(true);
      if (!token) throw new Error("No token");

      const res = await fetch(`${API_BASE_URL}/api/device/register`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to register device");

      addToast({
        title: "Device Registered",
        description: "Your BLE device has been successfully registered!",
        color: "success",
      });

      if (currentDeviceBLE && currentDeviceBLE.gatt?.connected) {
        await currentDeviceBLE.gatt.disconnect();
        setLocalConnected(false);
        setCurrentDeviceBLE(null);
        addToast({ title: "Device Disconnected", color: "success" });
      }

      setShowRegisterModal(false);
      await fetchActiveDevice();
      await fetchDevices();
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "Registration Failed",
        description: err.message || "An error occurred",
        color: "danger",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const refreshDevices = async () => {
    await fetchDevices();
  };
  const saveDevice = async (deviceName: string) => {
    try {
      if (!token) throw new Error("No authentication token found");

      const payload = {
        name: deviceName,
        serviceUuid: null,
        measurementCharUuid: null,
        logReadCharUuid: null,
        setTimeCharUuid: null,
        ledControlCharUuid: null,
        sleepControlCharUuid: null,
        alarmCharUuid: null,
      };

      const res = await fetch(`${API_BASE_URL}/api/device/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save device");

      addToast({ title: "Device created successfully", color: "success" });
      setShowCreateModal(false);

      //  Refresh list
      await fetchDevices();

      // move pagination to the *last* device (newly added one)
      setPage((prev) => devices.length + 1);
    } catch (err) {
      console.error(err);
      addToast({ title: "Error saving device", color: "danger" });
    }
  };

  return (
    <BluetoothDeviceContext.Provider
      value={{
        devices,
        activeDeviceId,
        isRegistered,
        page,
        setPage,
        isLayoutLoading,
        handleDeviceSelect,
        scanForDevices,
        currentDeviceBLE,
        showRegisterModal,
        setShowRegisterModal,
        setShowCreateModal,
        saveDevice,
        showCreateModal,
        registerDevice,
        form,
        isScanning,
        localConnected,
        isRegistering,
        refreshDevices: fetchDevices,
        showDeleteModal,
        setShowDeleteModal,
        deleteDevice,
      }}
    >
      {children}
    </BluetoothDeviceContext.Provider>
  );
};
