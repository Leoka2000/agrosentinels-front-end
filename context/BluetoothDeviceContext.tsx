"use client";

// extend navigator interface so typescript knows about bluetooth
declare global {
  interface Navigator {
    bluetooth: any;
  }
}

import React, { createContext, useContext, useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { useAuth } from "./AuthContext";
import { useBluetoothSensor } from "./useBluetoothSensor";

// simple type for devices
type Device = {
  id: number;
  name: string;
};

// shape of active device response from backend
type ActiveDeviceResponse = {
  deviceId: number;
  deviceName: string;
  registeredDevice?: boolean;
};

// context type that exposes all device-related state and actions
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
  hasCreatedFirstDevice: boolean;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  deleteDevice: () => Promise<void>;
  refreshTrigger: number;
  isCreating: boolean;
};

// type for bluetooth device object from web bluetooth api
type BluetoothDevice = {
  id: string;
  gatt?: any; // fallback to any because dom types may not include gatt
};

// create context for devices
const BluetoothDeviceContext = createContext<
  BluetoothDeviceContextType | undefined
>(undefined);

// hook to use bluetooth device context
export const useBluetoothDevice = () => {
  const context = useContext(BluetoothDeviceContext);
  if (!context)
    throw new Error(
      "useBluetoothDevice must be used within a BluetoothDeviceProvider"
    );
  return context;
};

// provider component wrapping app parts that need device info
export const BluetoothDeviceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // ---------------- state ----------------
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null); // tracks if active device is registered
  const [devices, setDevices] = useState<Device[]>([]); // list of all devices
  const [activeDeviceId, setActiveDeviceId] = useState<string>(""); // id of currently selected device
  const [isSelecting, setIsSelecting] = useState(false); // prevent multiple selects at same time
  const [deviceSelectionTrigger, setDeviceSelectionTrigger] = useState(0); // triggers refresh of selection
  const [page, setPage] = useState(1); // current page in device list
  const [isLayoutLoading, setIsLayoutLoading] = useState(true); // layout loading state
  const [showDeleteModal, setShowDeleteModal] = useState(false); // delete modal visibility
  const [refreshTrigger, setRefreshTrigger] = useState(0); // triggers refresh after first device creation
  const [isCreating, setIsCreating] = useState(false); // creating device state
  const [showRegisterModal, setShowRegisterModal] = useState(false); // show register modal
  const [currentDeviceBLE, setCurrentDeviceBLE] =
    useState<BluetoothDevice | null>(null); // currently connected ble device
  const [form, setForm] = useState({
    serviceUuid: "",
    measurementCharUuid: "",
    logReadCharUuid: "",
    setTimeCharUuid: "",
    ledControlCharUuid: "",
    sleepControlCharUuid: "",
    alarmCharUuid: "",
  }); // ble service/characteristic uuids for registration
  const [isScanning, setIsScanning] = useState(false); // scanning state
  const [localConnected, setLocalConnected] = useState(false); // ble connection state
  const [isRegistering, setIsRegistering] = useState(false); // registration process state
  const [hasCreatedFirstDevice, setHasCreatedFirstDevice] =
    useState<boolean>(true); // tracks if user created first device
  const [showCreateModal, setShowCreateModal] = useState(false); // show create modal

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // base url for api
  const { token } = useAuth(); // auth token from context

  // ---------------- fetch user device status ----------------
  const fetchDeviceStatus = async () => {
    if (!token) return; // skip if not authenticated

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/device-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch device status");

      const data: { hasCreatedFirstDevice: boolean } = await res.json();
      setHasCreatedFirstDevice(data.hasCreatedFirstDevice); // update state
    } catch (err) {
      console.error(err);
      setHasCreatedFirstDevice(true); // fallback: assume device exists to hide create modal
    }
  };

  useEffect(() => {
    fetchDeviceStatus(); // fetch status on mount
  }, [token]);

  // ---------------- fetch currently active device ----------------
  const fetchActiveDevice = async () => {
    if (!token) {
      // reset state if no token
      setIsLayoutLoading(false);
      setIsRegistered(false);
      setActiveDeviceId("");
      return;
    }

    setIsLayoutLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/device/active`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error(`Failed to fetch active device. Status: ${res.status}`);
        setIsRegistered(false);
        setActiveDeviceId("");
        return;
      }

      const text = await res.text();
      if (!text) {
        setIsRegistered(false);
        setActiveDeviceId("");
        return;
      }

      const data: ActiveDeviceResponse = JSON.parse(text);
      setIsRegistered(!!data.registeredDevice); // cast to boolean
      setActiveDeviceId(data.deviceId?.toString() || ""); // store as string
    } catch (error) {
      console.error("Error fetching active device:", error);
      setIsRegistered(false);
      setActiveDeviceId("");
    } finally {
      setIsLayoutLoading(false);
    }
  };

  // ---------------- fetch all user devices ----------------
  const fetchDevices = async (): Promise<Device[]> => {
    if (!token) {
      setDevices([]);
      return [];
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/device/list`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data: Device[] = await res.json();
      setDevices(data || []); // update state
      return data || [];
    } catch (err) {
      console.error(err);
      setDevices([]);
      return [];
    }
  };

  // ---------------- initial load ----------------
  useEffect(() => {
    if (token) {
      fetchActiveDevice(); // fetch active device
      fetchDevices(); // fetch all devices
    } else {
      setIsLayoutLoading(false);
      setDevices([]);
      setActiveDeviceId("");
    }
  }, [token]);

  // ---------------- auto-refresh when device selection changes ----------------
  useEffect(() => {
    if (token) fetchActiveDevice();
  }, [deviceSelectionTrigger, token]);

  useEffect(() => {
    if (token) fetchDevices();
  }, [deviceSelectionTrigger, token]);

  // ---------------- auto-select device based on page ----------------
  useEffect(() => {
    if (!devices || devices.length === 0) return;

    const clampedPage = Math.max(1, Math.min(page, devices.length));
    if (clampedPage !== page) {
      setPage(clampedPage);
      return;
    }

    const currentDevice = devices[clampedPage - 1];
    if (!currentDevice) return;

    if (!isSelecting && currentDevice.id.toString() !== activeDeviceId && token) {
      // trigger selection but don't await to avoid blocking
      handleDeviceSelect(currentDevice.id.toString()).catch((e) =>
        console.error("Auto select error:", e)
      );
    }
  }, [page, devices, isSelecting, activeDeviceId, token]);

  // ---------------- handle selecting a device ----------------
  const handleDeviceSelect = async (deviceId: string) => {
    try {
      setIsSelecting(true);
      setIsLayoutLoading(true);
      setActiveDeviceId(deviceId);

      if (!token) throw new Error("No authentication token found");

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

      setDeviceSelectionTrigger((prev) => prev + 1); // trigger refresh
      await fetchActiveDevice(); // refresh active device state
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "Error",
        description: err.message || "Failed to select device",
        color: "danger",
      });
    } finally {
      setIsSelecting(false);
      setIsLayoutLoading(false);
    }
  };

  // ---------------- scan for nearby ble devices ----------------
  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          // example service uuids
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
        await device.gatt.connect(); // establish connection
        setLocalConnected(true);
        await discoverServices(device); // discover services and characteristics
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

  // ---------------- delete device ----------------
  const deleteDevice = async () => {
    if (devices.length <= 1) {
      addToast({
        title: "Cannot delete device",
        description: "You must have at least one device",
        color: "warning",
      });
      setShowDeleteModal(false);
      return;
    }

    const activeDevice = devices.find(
      (d) => d.id.toString() === activeDeviceId
    );

    if (!activeDevice?.id) {
      addToast({ title: "No active device to delete", color: "warning" });
      setShowDeleteModal(false);
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

      // refresh list after deletion
      const updatedDevicesRes = await fetch(`${API_BASE_URL}/api/device/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!updatedDevicesRes.ok) throw new Error("Failed to fetch devices");
      const updatedDevices: Device[] = await updatedDevicesRes.json();
      setDevices(updatedDevices);

      if (updatedDevices.length > 0) {
        setActiveDeviceId(updatedDevices[0].id.toString());
        await handleDeviceSelect(updatedDevices[0].id.toString());
      } else {
        setActiveDeviceId("");
      }
    } catch (err) {
      console.error(err);
      addToast({ title: "Error deleting device", color: "danger" });
    } finally {
      setShowDeleteModal(false);
    }
  };

  // ---------------- discover services and characteristics ----------------
  const discoverServices = async (device: BluetoothDevice) => {
    try {
      if (!device.gatt) throw new Error("GATT not available");
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      const mappedForm = { ...form };
      for (const service of services) {
        if (service.uuid.includes("1111")) mappedForm.serviceUuid = service.uuid;
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.uuid.includes("2222")) mappedForm.measurementCharUuid = char.uuid;
          if (char.uuid.includes("4444")) mappedForm.setTimeCharUuid = char.uuid;
          if (char.uuid.includes("5555")) mappedForm.sleepControlCharUuid = char.uuid;
          if (char.uuid.includes("6666")) mappedForm.ledControlCharUuid = char.uuid;
          if (char.uuid.includes("7777")) mappedForm.logReadCharUuid = char.uuid;
          if (char.uuid.includes("3333")) mappedForm.alarmCharUuid = char.uuid;
        }
      }
      setForm(mappedForm);
      setShowRegisterModal(true); // show modal after discovering services
      addToast({ title: "Service discovery complete", color: "success" });
    } catch (err) {
      console.error(err);
      addToast({ title: "Service discovery failed", color: "danger" });
    }
  };

  // ---------------- register device with backend ----------------
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

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to register device: ${res.status} ${errorText}`);
      }

      addToast({
        title: "Device Registered",
        description: "Your BLE device has been successfully registered!",
        color: "success",
      });

      if (currentDeviceBLE && currentDeviceBLE.gatt?.connected) {
        await currentDeviceBLE.gatt.disconnect(); // disconnect ble
        setLocalConnected(false);
        setCurrentDeviceBLE(null);
        addToast({ title: "Device Disconnected", color: "success" });
      }

      setShowRegisterModal(false);
      setRefreshTrigger((prev) => (prev === 0 ? 1 : 0)); // trigger refresh
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

  // ---------------- save a new device ----------------
  const saveDevice = async (deviceName: string) => {
    setIsCreating(true);
    try {
      if (!token) throw new Error("No authentication token found");

      // fetch device status
      const statusRes = await fetch(`${API_BASE_URL}/users/me/device-status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!statusRes.ok) throw new Error("Failed to fetch device status");

      const statusData: { hasCreatedFirstDevice: boolean } =
        await statusRes.json();

      if (!statusData.hasCreatedFirstDevice) {
        const patchRes = await fetch(
          `${API_BASE_URL}/users/me/device-status?status=true`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!patchRes.ok) throw new Error("Failed to update device status");

        addToast({ title: "Device status updated to true", color: "success" });
        setRefreshTrigger((prev) => (prev === 0 ? 1 : 0));
        setHasCreatedFirstDevice(true);
      }

      // create device
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

      const updatedDevices = await fetchDevices();
      await fetchActiveDevice();
      setPage(updatedDevices.length); // navigate to new device. VERY impprtant to avoid confusion for user
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "Error saving device",
        description: err.message || "",
        color: "danger",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ---------------- persist page in local storage ----------------
  useEffect(() => {
    const savedPage = localStorage.getItem("activePage");
    if (savedPage) setPage(parseInt(savedPage, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem("activePage", page.toString());
  }, [page]);

  useEffect(() => {
    if (devices && devices.length > 0) {
      const currentDevice = devices[page - 1];
      if (currentDevice && currentDevice.id.toString() !== activeDeviceId) {
        handleDeviceSelect(currentDevice.id.toString()).catch((e) =>
          console.error("Page select error:", e)
        );
      }
      setDeviceSelectionTrigger((prev) => prev + 1); // force refresh for sensor context
    }
  }, [page]);

  // ---------------- provide all state and actions to context ----------------
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
        refreshDevices: async () => {
          await fetchDevices();
        },
        isCreating,
        showDeleteModal,
        setShowDeleteModal,
        deleteDevice,
        hasCreatedFirstDevice,
        refreshTrigger,
      }}
    >
      {children}
    </BluetoothDeviceContext.Provider>
  );
};
