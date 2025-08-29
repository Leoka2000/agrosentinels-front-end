"use client";

import React, { useState } from "react";
import { Bluetooth, BluetoothOff, Loader2 } from "lucide-react";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { getToken } from "@/lib/auth";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useBluetoothSensor } from "../context/useBluetoothSensor";

interface BluetoothConnectButtonProps {
  onDeviceCreated?: () => void;
}

type BluetoothDevice = {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
};

const BluetoothConnectButton: React.FC<BluetoothConnectButtonProps> = ({
  onDeviceCreated,
}) => {
  const { connectBluetooth, disconnectBluetooth } = useBluetoothSensor();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [isScanning, setIsScanning] = useState(false);
  const [localConnected, setLocalConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<BluetoothDevice | null>(
    null
  );
  const [characteristics, setCharacteristics] = useState<
    Record<string, BluetoothRemoteGATTCharacteristic>
  >({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for new device
  const [form, setForm] = useState({
    name: "My BLE Device",
    serviceUuid: "",
    measurementCharUuid: "",
    logReadCharUuid: "",
    setTimeCharUuid: "",
    ledControlCharUuid: "",
    sleepControlCharUuid: "",
    alarmCharUuid: "",
  });

  // --- Discover services + map UUIDs ---
  const discoverServicesAndCharacteristics = async (
    device: BluetoothDevice
  ) => {
    try {
      if (!device.gatt) throw new Error("GATT server not available");
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      const charMap: Record<string, BluetoothRemoteGATTCharacteristic> = {};
      const mappedForm = { ...form, name: device.name || "My BLE Device" };

      for (const service of services) {
        console.log("Discovered service:", service.uuid);
        if (service.uuid.includes("1111")) {
          mappedForm.serviceUuid = service.uuid;
        }

        const chars = await service.getCharacteristics();
        for (const char of chars) {
          charMap[char.uuid] = char;
          console.log("Discovered characteristic:", char.uuid);

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

      setCharacteristics(charMap);
      setForm(mappedForm);
      setShowCreateModal(true);
      addToast({ title: "Service discovery complete", color: "success" });
    } catch (err) {
      console.error(err);
      addToast({ title: "Failed to discover services", color: "danger" });
    }
  };

  // --- Scan + connect ---
  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [], // discover all
      });
      setCurrentDevice(device);

      if (device.gatt) {
        await device.gatt.connect();
        setLocalConnected(true);
        await discoverServicesAndCharacteristics(device);
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

  // --- Disconnect ---
  const handleDisconnect = () => {
    if (currentDevice?.gatt?.connected) currentDevice.gatt.disconnect();
    setLocalConnected(false);
    setCurrentDevice(null);
    setCharacteristics({});
    addToast({ title: "Disconnected", color: "warning" });
  };

  // --- BLE Write Actions ---
  const writeSetTime = async () => {
    const char = characteristics[form.setTimeCharUuid];
    if (!char)
      return addToast({
        title: "Set Time characteristic not found",
        color: "warning",
      });

    const timestamp = Math.floor(Date.now() / 1000);
    console.log("Writing current timestamp:", timestamp);

    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, timestamp, true);
    await char.writeValue(buffer);
    addToast({ title: "Timestamp sent", color: "success" });
  };

  const writeSleepOn = async () => {
    const char = characteristics[form.sleepControlCharUuid];
    if (!char)
      return addToast({
        title: "Sleep Control characteristic not found",
        color: "warning",
      });

    console.log("Sending Sleep ON (0x4E)");
    await char.writeValue(Uint8Array.of(0x4e));
    addToast({ title: "Sleep ON sent", color: "success" });
  };

  const writeSleepOff = async () => {
    const char = characteristics[form.sleepControlCharUuid];
    if (!char)
      return addToast({
        title: "Sleep Control characteristic not found",
        color: "warning",
      });

    console.log("Sending Sleep OFF (0x46)");
    await char.writeValue(Uint8Array.of(0x46));
    addToast({ title: "Sleep OFF sent", color: "success" });
  };

  // --- Save to backend ---
  const saveDevice = async () => {
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token found");
      const res = await fetch(`${API_BASE_URL}/api/device/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save device");
      addToast({ title: "Device saved successfully", color: "success" });
      setShowCreateModal(false);
      onDeviceCreated?.();
    } catch (err) {
      console.error(err);
      addToast({ title: "Error saving device", color: "danger" });
    }
  };

  return (
    <div className="flex flex-col pt-3 w-full items-end gap-3">
      {!localConnected ? (
        <Button
          className="md:w-58 w-full"
          onPress={scanForDevices}
          color="success"
          variant="shadow"
          isDisabled={isScanning}
          startContent={
            isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bluetooth className="h-4 w-4" />
            )
          }
        >
          {isScanning ? "Scanning..." : "Scan for Devices"}
        </Button>
      ) : (
        <Button
          onPress={handleDisconnect}
          color="danger"
          className="md:w-58 w-full"
          startContent={<BluetoothOff className="h-4 w-4" />}
        >
          Disconnect
        </Button>
      )}

      {/* Action buttons once connected */}
      {localConnected && (
        <div className="flex flex-col gap-2 w-full">
          <Button onPress={writeSetTime} color="primary">
            Send Current Timestamp
          </Button>
          <Button onPress={writeSleepOn} color="secondary">
            Sleep ON
          </Button>
          <Button onPress={writeSleepOff} color="secondary">
            Sleep OFF
          </Button>
        </div>
      )}

      {/* Modal for creating device */}
      <Modal isOpen={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent>
          <ModalHeader>Add New Device</ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            <Input
              label="Device Name"
              value={form.name}
              onValueChange={(v) => setForm({ ...form, name: v })}
            />
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
              onPress={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button color="success" onPress={saveDevice}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default BluetoothConnectButton;
