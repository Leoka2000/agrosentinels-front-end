"use client";

import React, { useState } from "react";
import { Bluetooth, BluetoothOff, Loader2 } from "lucide-react";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { useBluetoothSensor } from "../context/useBluetoothSensor";

interface BluetoothConnectButtonProps {
  serviceUuid: string;
  setTimeCharUuid: string;
  sleepControlCharUuid: string;
}

type BluetoothDevice = {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
};

const BluetoothConnectButton: React.FC<BluetoothConnectButtonProps> = ({
  serviceUuid,
  setTimeCharUuid,
  sleepControlCharUuid,
}) => {
  const { connectBluetooth, disconnectBluetooth } = useBluetoothSensor();
  const [isScanning, setIsScanning] = useState(false);
  const [localConnected, setLocalConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<BluetoothDevice | null>(null);
  const [characteristics, setCharacteristics] = useState<Record<string, BluetoothRemoteGATTCharacteristic>>({});

  // --- Discover services + characteristics ---
  const discoverServicesAndCharacteristics = async (device: BluetoothDevice) => {
    try {
      if (!device.gatt) throw new Error("GATT server not available");
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(serviceUuid);
      const chars = await service.getCharacteristics();
      const charMap: Record<string, BluetoothRemoteGATTCharacteristic> = {};
      for (const char of chars) {
        charMap[char.uuid] = char;
      }
      setCharacteristics(charMap);
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
        optionalServices: [serviceUuid],
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
    const char = characteristics[setTimeCharUuid];
    if (!char) return addToast({ title: "Set Time characteristic not found", color: "warning" });

    const timestamp = Math.floor(Date.now() / 1000);
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, timestamp, true);
    await char.writeValue(buffer);
    addToast({ title: "Timestamp sent", color: "success" });
  };

  const writeSleepOn = async () => {
    const char = characteristics[sleepControlCharUuid];
    if (!char) return addToast({ title: "Sleep Control characteristic not found", color: "warning" });

    await char.writeValue(Uint8Array.of(0x4e));
    addToast({ title: "Sleep ON sent", color: "success" });
  };

  const writeSleepOff = async () => {
    const char = characteristics[sleepControlCharUuid];
    if (!char) return addToast({ title: "Sleep Control characteristic not found", color: "warning" });

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
        <Button
          onPress={handleDisconnect}
          color="danger"
          className="md:w-58 w-full"
          startContent={<BluetoothOff className="h-4 w-4" />}
        >
          Disconnect
        </Button>
      )}

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
    </div>
  );
};

export default BluetoothConnectButton;
