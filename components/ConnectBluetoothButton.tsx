"use client";

import React, { useState } from "react";
import { Bluetooth, BluetoothOff, Loader2, OctagonPause, Play } from "lucide-react";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

const KNOWN_SERVICES = [
  "0000180a-0000-1000-8000-00805f9b34fb",
  "11111111-1111-1111-1111-111111111111",
  "44444444-4444-4444-4444-444444444444", // SET_TIME
  "55555555-5555-5555-5555-555555555555", // SLEEP_CONTROL
];

interface BluetoothConnectButtonProps {
  onDeviceCreated?: () => void;
}

type BluetoothDevice = {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
};

const BluetoothConnectButton: React.FC<BluetoothConnectButtonProps> = ({ onDeviceCreated }) => {
  const { connectBluetooth, disconnectBluetooth } = useBluetoothSensor();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [isScanning, setIsScanning] = useState(false);
  const [localConnected, setLocalConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<BluetoothDevice | null>(null);
  const [characteristics, setCharacteristics] = useState<Record<string, BluetoothRemoteGATTCharacteristic>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deviceName, setDeviceName] = useState("My BLE Device");

  // Discover all characteristics
  const discoverServicesAndCharacteristics = async (device: BluetoothDevice) => {
    try {
      if (!device.gatt) throw new Error("GATT server not available");
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      const charMap: Record<string, BluetoothRemoteGATTCharacteristic> = {};

      for (const service of services) {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          charMap[char.uuid] = char;
          console.log("Discovered characteristic:", char.uuid);
        }
      }

      setCharacteristics(charMap);
      setShowCreateModal(true);
      addToast({ title: "Service discovery complete", color: "success" });
    } catch (err) {
      console.error(err);
      addToast({ title: "Failed to discover services", color: "danger" });
    }
  };

  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_SERVICES,
      });
      setCurrentDevice(device);

      if (device.gatt) {
        await device.gatt.connect();
        setLocalConnected(true);
        await discoverServicesAndCharacteristics(device);
      }
    } catch (err: any) {
      console.error(err);
      addToast({ title: err?.message || "Connection failed", color: "warning" });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = () => {
    if (currentDevice?.gatt?.connected) currentDevice.gatt.disconnect();
    setLocalConnected(false);
    setCurrentDevice(null);
    setCharacteristics({});
    addToast({ title: "Disconnected", color: "warning" });
  };

  // --- BLE Write Actions ---
  const writeSetTime = async () => {
    const char = characteristics["44444444-4444-4444-4444-444444444444"];
    if (!char) return addToast({ title: "Set Time characteristic not found", color: "warning" });

    const timestamp = Math.floor(Date.now() / 1000);
    console.log("Writing current timestamp:", timestamp);

    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, timestamp, true); // little endian
    await char.writeValue(buffer);
    addToast({ title: "Timestamp sent", color: "success" });
  };

  const writeSleepOn = async () => {
    const char = characteristics["55555555-5555-5555-5555-555555555555"];
    if (!char) return addToast({ title: "Sleep Control characteristic not found", color: "warning" });

    console.log("Sending Sleep ON (0x4E)");
    await char.writeValue(Uint8Array.of(0x4e));
    addToast({ title: "Sleep ON sent", color: "success" });
  };

  const writeSleepOff = async () => {
    const char = characteristics["55555555-5555-5555-5555-555555555555"];
    if (!char) return addToast({ title: "Sleep Control characteristic not found", color: "warning" });

    console.log("Sending Sleep OFF (0x46)");
    await char.writeValue(Uint8Array.of(0x46));
    addToast({ title: "Sleep OFF sent", color: "success" });
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
          startContent={isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bluetooth className="h-4 w-4" />}
        >
          {isScanning ? "Scanning..." : "Scan for Devices"}
        </Button>
      ) : (
        <Button onPress={handleDisconnect} color="danger" className="md:w-58 w-full" startContent={<BluetoothOff className="h-4 w-4" />}>
          Disconnect
        </Button>
      )}

      {localConnected && (
        <div className="flex flex-col gap-2 w-full">
          <Button onPress={writeSetTime} color="primary">Send Current Timestamp</Button>
          <Button onPress={writeSleepOn} color="secondary">Sleep ON</Button>
          <Button onPress={writeSleepOff} color="secondary">Sleep OFF</Button>
        </div>
      )}

      {/* Modal for creating device */}
      <Modal isOpen={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent>
          <ModalHeader>Add New Device</ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            <Input label="Device Name" value={deviceName} onValueChange={setDeviceName} />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setShowCreateModal(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default BluetoothConnectButton;
