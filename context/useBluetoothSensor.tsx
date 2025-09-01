"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { getToken } from "../lib/auth";
import { addToast } from "@heroui/toast";
import {
  parseTimestampHex,
  parseBatteryVoltageHex,
  parseTemperatureHex,
  parseAccelerometerHex,
} from "../lib/utils";

interface ActiveDevice {
  deviceId: number;
  deviceName: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
  measurementCharUuid: string;
  userId: number;
  setTimeCharUuid: string; 
  sleepControlCharUuid: string;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothSensorContextValue {
  activeDevice: ActiveDevice | null;
  refreshActiveDevice: () => Promise<void>;
  scanForDevices: (serviceUuid: string) => Promise<void>;
  disconnectBluetooth: () => void;
  localConnected: boolean;
  currentDevice: BluetoothDevice | null;
  characteristics: Record<string, BluetoothRemoteGATTCharacteristic>;
  writeSetTime: (setTimeCharUuid: string) => Promise<void>;
  writeSleepOn: (sleepControlCharUuid: string) => Promise<void>;
  writeSleepOff: (sleepControlCharUuid: string) => Promise<void>;
  startStreaming: (measurementCharUuid: string) => Promise<void>;
  getHistoricalLogs: (logReadCharUuid: string) => Promise<void>;
}

const BluetoothSensorContext =
  createContext<BluetoothSensorContextValue | null>(null);

export const BluetoothSensorProvider = ({
  children,
  deviceSelectionTrigger,
}: {
  children: ReactNode;
  deviceSelectionTrigger?: number;
}) => {
  const [activeDevice, setActiveDevice] = useState<ActiveDevice | null>(null);
  const [localConnected, setLocalConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<BluetoothDevice | null>(
    null
  );
  const [characteristics, setCharacteristics] = useState<
    Record<string, BluetoothRemoteGATTCharacteristic>
  >({});
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // ---------------- fetch active device ----------------
  const fetchActiveDevice = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/device/active`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: ActiveDevice = await response.json();
        setActiveDevice(data);
        console.log("🔄 Active device updated:", data);
        return data;
      } else {
        console.error("Failed to fetch active device:", response.statusText);
        setActiveDevice(null);
        return null;
      }
    } catch (error) {
      console.error("Error fetching active device:", error);
      setActiveDevice(null);
      return null;
    }
  }, []);

  const refreshActiveDevice = useCallback(async () => {
    await fetchActiveDevice();
  }, [fetchActiveDevice]);

  useEffect(() => {
    fetchActiveDevice();
  }, [fetchActiveDevice]);
  useEffect(() => {
    if (deviceSelectionTrigger !== undefined && deviceSelectionTrigger > 0) {
      console.log("🔔 Device selection changed, refreshing active device...");
      fetchActiveDevice();
    }
  }, [deviceSelectionTrigger, fetchActiveDevice]);

  // ---------------- bluetooth logic ----------------
  const discoverServicesAndCharacteristics = async (
    device: BluetoothDevice,
    serviceUuid: string
  ) => {
    try {
      if (!device.gatt) throw new Error("GATT server not available");
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(serviceUuid);
      const chars = await service.getCharacteristics();
      const charMap: Record<string, BluetoothRemoteGATTCharacteristic> = {};
      for (const char of chars) charMap[char.uuid] = char;
      setCharacteristics(charMap);
      addToast({ title: "Service discovery complete", color: "success" });
    } catch (err) {
      console.error(err);
      addToast({ title: "Failed to discover services", color: "danger" });
    }
  };

  const scanForDevices = async (serviceUuid: string) => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [serviceUuid],
      });
      setCurrentDevice(device);
      if (device.gatt) {
        await device.gatt.connect();
        setLocalConnected(true);
        await discoverServicesAndCharacteristics(device, serviceUuid);
      }
    } catch (err: any) {
      console.error(err);
      addToast({
        title: err?.message || "Connection failed",
        color: "warning",
      });
    }
  };

  // ---------------- cleanup helpers ----------------
  const stopStreaming = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
      console.log("🛑 Streaming stopped and interval cleared");
      addToast({ title: "Streaming stopped", color: "warning" });
    }
  };

  const disconnectBluetooth = () => {
    stopStreaming();
    if (currentDevice?.gatt?.connected) currentDevice.gatt.disconnect();
    setLocalConnected(false);
    setCurrentDevice(null);
    setCharacteristics({});
    addToast({ title: "Disconnected", color: "warning" });
  };

  // ---------------- writers ----------------
  const writeSetTime = async (setTimeCharUuid: string): Promise<void> => {
    const char = characteristics[setTimeCharUuid];
    if (!char) {
      addToast({
        title: "Set Time characteristic not found",
        color: "warning",
      });
      return;
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, timestamp, true);
    await char.writeValue(buffer);
    addToast({ title: "Timestamp sent", color: "success" });
    console.log("⏰ Timestamp sent:", timestamp);
  };

  const writeSleepOn = async (sleepControlCharUuid: string) => {
    const char = characteristics[sleepControlCharUuid];
    if (!char)
      return addToast({
        title: "Sleep Control characteristic not found",
        color: "warning",
      });
    await char.writeValue(Uint8Array.of(0x4e));
    addToast({ title: "Sleep ON sent", color: "success" });
  };

  const writeSleepOff = async (sleepControlCharUuid: string) => {
    const char = characteristics[sleepControlCharUuid];
    if (!char)
      return addToast({
        title: "Sleep Control characteristic not found",
        color: "warning",
      });
    await char.writeValue(Uint8Array.of(0x46));
    stopStreaming(); // 🛑 stop the 30s cycle too
    addToast({ title: "Sleep OFF sent + streamiyg stopped", color: "success" });
  };

  // ---------------- Start streaming ----------------
  const startStreaming = async (measurementCharUuid: string) => {
    const char = characteristics[measurementCharUuid];
    if (!char)
      return addToast({
        title: "Measurement characteristic not found",
        color: "warning",
      });

    try {
      stopStreaming(); // ensure fresh start

      await char.startNotifications();
      char.addEventListener("characteristicvaluechanged", (event: any) => {
        try {
          const value: DataView = event.target.value;
          let hexString = "";
          for (let i = 0; i < value.byteLength; i++) {
            hexString += value.getUint8(i).toString(16).padStart(2, "0");
          }
          console.log("📡 Measurement received (hex):", hexString);
          // ... keep your parsing + API post logic here ...
        } catch (err) {
          console.error("Error processing measurement:", err);
        }
      });

      // set up periodic writeSetTime every 30s
      if (activeDevice?.setTimeCharUuid) {
        const runSetTime = async () => {
          try {
            await writeSetTime(activeDevice.setTimeCharUuid);
          } catch (err) {
            console.error("❌ Failed to run periodic writeSetTime:", err);
          }
        };
        // first run immediately
        await runSetTime();
        streamingIntervalRef.current = setInterval(runSetTime, 30_000);
      } else {
        console.warn("⚠️ No setTimeCharUuid in activeDevice");
      }

      addToast({ title: "Streaming started", color: "success" });
    } catch (err) {
      console.error("failed to start streaming:", err);
      addToast({ title: "failed to start streaming", color: "danger" });
    }
  };

  return (
    <BluetoothSensorContext.Provider
      value={{
        activeDevice,
        refreshActiveDevice,
        scanForDevices,
        disconnectBluetooth,
        localConnected,
        currentDevice,
        characteristics,
        writeSetTime,
        writeSleepOn,
        writeSleepOff,
        startStreaming,
        getHistoricalLogs: async () => {}, // trimmed for clarity
      }}
    >
      {children}
    </BluetoothSensorContext.Provider>
  );
};

export const useBluetoothSensor = () => {
  const ctx = useContext(BluetoothSensorContext);
  if (!ctx)
    throw new Error(
      "useBluetoothSensor must be used within BluetoothSensorProvider"
    );
  return ctx;
};
