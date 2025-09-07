"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Bluetooth, BluetoothOff, Loader2 } from "lucide-react";
import { addToast } from "@heroui/toast";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import VoltageProvider from "@/components/voltage/VoltageProvider";
import AccelerometerProvider from "@/components/accelerometer/AccelerometerProvider";
import BluetoothConnectButton from "@/components/ConnectBluetoothButton";
import DeleteDeviceButton from "@/components/DeleteDeviceBtn";
import { getToken } from "@/lib/auth";
import { PlaceholderCards } from "@/components/PlaceholderCards";
import { PlaceholderChart } from "@/components/PlaceholderChart";
import { Alert } from "@heroui/alert";
import { useBluetoothSensor } from "../../../context/useBluetoothSensor";
import { Input } from "@heroui/input";
import TemperatureWrapper from "@/components/temperature/TemperatureWrapper";
import { TemperatureCard } from "@/components/temperature/TemperatureCard";

interface Device {
  id: number;
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

interface ActiveDeviceResponse {
  deviceId: number;
  deviceName: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
  registeredDevice?: boolean;
}

const DashboardContent: React.FC = () => {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [deviceSelectionTrigger, setDeviceSelectionTrigger] =
    useState<number>(0);
  const [page, setPage] = useState(1);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);

  // BLE registration modal state
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token = getToken();

  type BluetoothDevice = {
    id: string;
    gatt?: BluetoothRemoteGATTServer;
  };

  // --- Fetch active device ---
  const fetchActiveDevice = async () => {
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
      setIsRegistered(data.registeredDevice ?? true);
      setActiveDeviceId(data.deviceId?.toString() || "");
    } catch (error) {
      console.error(error);
      setIsRegistered(false);
    } finally {
      setIsLayoutLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDevice();
  }, [API_BASE_URL, token]);

  // --- Fetch devices ---
  const fetchDevices = async () => {
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
    fetchDevices();
  }, [deviceSelectionTrigger]);

  // --- Handle device select ---
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

  const currentDevice = devices[page - 1];

  // --- BLE Registration ---
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
          "77777777-7777-7777-7777-777777777777", // Corrected last UUID, full 36 chars
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
      setIsRegistering(true); // Start spinner
      const token = getToken();
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

      // ✅ Show success toast
      addToast({
        title: "Device Registered",
        description: "Your BLE device has been successfully registered!",
        color: "success",
      });

      // Disconnect from the BLE device after registration
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
      setIsRegistering(false); // Stop spinner
    }
  };

  // --- Spinner while layout switches ---
  if (isLayoutLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner color="primary" label="Loading..." />
      </div>
    );
  }

  return (
    <div className="gap-4 px-6 py-2">
      <div className="flex justify-center pl-1 mb-5 flex-col">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-md">
          Visualize your device's health and live metrics
        </p>
      </div>

      <div className="flex justify-center my-6">
        <Pagination
          showControls
          total={devices.length}
          page={page}
          onChange={setPage}
        />
      </div>

      {isRegistered ? (
        <div className="mx-auto ">
          {currentDevice && (
            <Card className="px-8 py-6 w-full">
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video">
                  <TemperatureCard />
                </div>
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
              </div>
              <CardBody>
                <div className="flex md:flex-row flex-col items-center justify-between w-full">
                  <div className="flex justify-between items-center space-x-2 mb-4">
                    <Kbd className="p-1.5">
                      <Bluetooth size={15} />
                    </Kbd>
                    <span className="font-medium text-xl">
                      {currentDevice.name}
                    </span>
                  </div>
                  <BluetoothConnectButton />
                </div>
              </CardBody>

              <CardBody>
                <VoltageProvider />
              </CardBody>
              <CardBody>
                <TemperatureWrapper />
              </CardBody>
              <CardBody>
                <AccelerometerProvider />
              </CardBody>
            </Card>
          )}
          <div className="flex justify-center mt-6">
            <Pagination
              showControls
              total={devices.length}
              page={page}
              onChange={setPage}
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto ">
          <Card className="px-8 py-6 w-full relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/900 backdrop-blur-sm z-10">
              <div className="absolute top-32 shadow-2xl border border-neutral-300 dark:border-neutral-800 rounded-xl p-10 px-8 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center">
                <Alert
                  color="warning"
                  title="Your device is not registered."
                  description="Please register it to start monitoring your device"
                  endContent={
                    <Button
                      color="warning"
                      size="sm"
                      variant="flat"
                      className="ml-12"
                      onPress={scanForDevices}
                    >
                      {isScanning ? (
                        <Spinner color="warning" size="sm" />
                      ) : (
                        "Register"
                      )}
                    </Button>
                  }
                />
              </div>
            </div>

            <CardBody className="flex grid-cols-4">
              <PlaceholderCards />
            </CardBody>
            <CardBody>
              <PlaceholderChart />
            </CardBody>
          </Card>
        </div>
      )}

      {/* BLE Registration Modal */}
      <Modal isOpen={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <ModalContent>
          <ModalHeader>Register Device</ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            <Input label="Service UUID" value={form.serviceUuid} readOnly />
            <Input
              label="Measurement Char UUID"
              value={form.measurementCharUuid}
              readOnly
            />
            <Input
              label="Log Read Char UUID"
              value={form.logReadCharUuid}
              readOnly
            />
            <Input
              label="Set Time Char UUID"
              value={form.setTimeCharUuid}
              readOnly
            />
            <Input
              label="LED Control Char UUID"
              value={form.ledControlCharUuid}
              readOnly
            />
            <Input
              label="Sleep Control Char UUID"
              value={form.sleepControlCharUuid}
              readOnly
            />
            <Input
              label="Alarm Char UUID"
              value={form.alarmCharUuid}
              readOnly
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              onPress={() => setShowRegisterModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="success"
              onPress={registerDevice}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <Spinner color="success" size="sm" />
              ) : (
                "Register"
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DashboardContent;
