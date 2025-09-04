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
  parseFrequencyHex,
  parseAmplitudeHex,
} from "../lib/utils";

interface ActiveDevice {
  deviceId: number;
  deviceName: string;
  userId: number;
  serviceUuid: string;
  measurementCharUuid: string;
  alarmCharUuid: string;
  ledControlCharUuid: string;
  logReadCharUuid: string;
  setTimeCharUuid: string;
  sleepControlCharUuid: string;
  registeredDevice: boolean;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: any;
}

interface BluetoothSensorContextValue {
  activeDevice: ActiveDevice | null;
  refreshActiveDevice: () => Promise<void>;
  scanForDevices: (serviceUuid: string) => Promise<void>;
  disconnectBluetooth: () => void;
  localConnected: boolean;
  currentDevice: BluetoothDevice | null;
  characteristics: Record<string, BluetoothRemoteGATTCharacteristic>;
  setCharacteristics: (
    chars: Record<string, BluetoothRemoteGATTCharacteristic>
  ) => void;
  writeSetTime: (setTimeCharUuid: string) => Promise<void>;
  writeSleepOn: (sleepControlCharUuid: string) => Promise<void>;
  writeSleepOff: (sleepControlCharUuid: string) => Promise<void>;
  startStreaming: () => Promise<void>;
  getHistoricalLogs: (logReadCharUuid: string) => Promise<void>;
}

const BluetoothSensorContext =
  createContext<BluetoothSensorContextValue | null>(null);

interface BluetoothSensorProviderProps {
  children: ReactNode;
  deviceSelectionTrigger?: number;
}

export const BluetoothSensorProvider = ({
  children,
  deviceSelectionTrigger,
}: BluetoothSensorProviderProps) => {
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

  // ---------------- fetch active device logic ----------------
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
      console.log("Device selection changed, refreshing active device...");
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

  // ---------------- stop streaming (cleanup) ----------------
  const stopStreaming = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
      console.log("Streaming stopped and interval cleared");
      addToast({ title: "Streaming stopped", color: "warning" });
    }
  };

  // ---------------- disconnect cleanup ----------------
  const disconnectBluetooth = () => {
    stopStreaming(); // cleanup interval on disconnect
    if (currentDevice?.gatt?.connected) currentDevice.gatt.disconnect();
    setLocalConnected(false);
    setCurrentDevice(null);
    setCharacteristics({});
    addToast({ title: "Disconnected", color: "warning" });
  };

  // ---------------- Write Big-Endian Timestamp ----------------
  const writeSetTime = async (setTimeCharUuid: string): Promise<void> => {
    const char = characteristics[setTimeCharUuid];
    if (!char) {
      addToast({
        title: "Set Time characteristic not found",
        color: "warning",
      });
      return;
    }
    // Get current Unix timestamp (seconds since 1970)
    const timestamp = Math.floor(Date.now() / 1000);
    // Write timestamp as 4-byte big-endian
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, timestamp, false); // false = big-endian
    await char.writeValue(buffer);
    addToast({ title: "Timestamp sent (big-endian)", color: "success" });
    console.log("⏰ Timestamp sent (big-endian):", timestamp.toString(16));
  };

  // ---------------- Sleep Control ----------------
  const writeSleepOn = async (sleepControlCharUuid: string) => {
    const char = characteristics[sleepControlCharUuid];
    if (!char)
      return addToast({
        title: "Sleep Control characteristic not found",
        color: "warning",
      });
    await char.writeValue(Uint8Array.of(0x4e)); // Sleep ON
    addToast({ title: "Sleep ON sent", color: "success" });
  };

  const writeSleepOff = async (sleepControlCharUuid: string) => {
    const char = characteristics[sleepControlCharUuid];
    if (!char)
      return addToast({
        title: "Sleep Control characteristic not found",
        color: "warning",
      });
    await char.writeValue(Uint8Array.of(0x46)); // Sleep OFF
    addToast({ title: "Sleep OFF sent", color: "success" });
  };

  // ---------------- Start streaming ----------------
  const startStreaming = async () => {
    if (!activeDevice) return;
    const measurementChar = characteristics[activeDevice.measurementCharUuid];
    const setTimeChar = characteristics[activeDevice.setTimeCharUuid];
    if (!measurementChar || !setTimeChar) {
      console.error("🔹 Characteristics currently available:", characteristics);
      return addToast({
        title: "Required characteristics not found",
        color: "warning",
      });
    }

    try {
      // Stop any existing streaming
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }

      // Start notifications
      await measurementChar.startNotifications();
      measurementChar.addEventListener(
        "characteristicvaluechanged",
        async (event: any) => {
          try {
            const value: DataView = event.target.value;
            let hexString = "";
            for (let i = 0; i < value.byteLength; i++) {
              hexString += value.getUint8(i).toString(16).padStart(2, "0");
            }
            console.log("📡 Measurement received (hex):", hexString);

            if (!activeDevice) return;
            const numericDeviceId = activeDevice.deviceId;

            // Parse all values
            const unixTimestamp = parseTimestampHex(hexString);
            const batteryVoltage = parseBatteryVoltageHex(hexString);
            const temperature = parseTemperatureHex(hexString);
            const accel = parseAccelerometerHex(hexString);
            const frequencies = parseFrequencyHex(hexString);
            const amplitudes = parseAmplitudeHex(hexString);
            const token = getToken();

            // Log all values being sent to backend
            console.log("📤 Sending to backend:", {
              deviceId: numericDeviceId,
              timestamp: unixTimestamp,
              voltage: !isNaN(batteryVoltage) ? batteryVoltage : "invalid",
              temperature: !isNaN(temperature) ? temperature : "invalid",
              accelerometer:
                !isNaN(accel.x) && !isNaN(accel.y) && !isNaN(accel.z)
                  ? accel
                  : "invalid",
              frequencies:
                !isNaN(frequencies.freq1) &&
                !isNaN(frequencies.freq2) &&
                !isNaN(frequencies.freq3) &&
                !isNaN(frequencies.freq4)
                  ? frequencies
                  : "invalid",
              amplitudes:
                !isNaN(amplitudes.ampl1) &&
                !isNaN(amplitudes.ampl2) &&
                !isNaN(amplitudes.ampl3) &&
                !isNaN(amplitudes.ampl4)
                  ? amplitudes
                  : "invalid",
            });

            // Send voltage
            if (!isNaN(batteryVoltage)) {
              await fetch(`${API_BASE_URL}/api/voltage`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  voltage: batteryVoltage,
                  timestamp: unixTimestamp,
                }),
              });
            }

            // Send temperature
            if (!isNaN(temperature)) {
              await fetch(`${API_BASE_URL}/api/temperature`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  temperature,
                  timestamp: unixTimestamp,
                }),
              });
            }

            // Send accelerometer
            if (!isNaN(accel.x) && !isNaN(accel.y) && !isNaN(accel.z)) {
              await fetch(`${API_BASE_URL}/api/accelerometer`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  x: accel.x,
                  y: accel.y,
                  z: accel.z,
                  timestamp: unixTimestamp,
                }),
              });
            }

            // Send frequencies
            if (
              !isNaN(frequencies.freq1) &&
              !isNaN(frequencies.freq2) &&
              !isNaN(frequencies.freq3) &&
              !isNaN(frequencies.freq4)
            ) {
              await fetch(`${API_BASE_URL}/api/frequency`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  freq1: frequencies.freq1,
                  freq2: frequencies.freq2,
                  freq3: frequencies.freq3,
                  freq4: frequencies.freq4,
                  timestamp: unixTimestamp,
                }),
              });
            }

            // Send amplitudes
            if (
              !isNaN(amplitudes.ampl1) &&
              !isNaN(amplitudes.ampl2) &&
              !isNaN(amplitudes.ampl3) &&
              !isNaN(amplitudes.ampl4)
            ) {
              await fetch(`${API_BASE_URL}/api/amplitude`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  ampl1: amplitudes.ampl1,
                  ampl2: amplitudes.ampl2,
                  ampl3: amplitudes.ampl3,
                  ampl4: amplitudes.ampl4,
                  timestamp: unixTimestamp,
                }),
              });
            }
          } catch (err) {
            console.error("Error processing measurement:", err);
          }
        }
      );

      addToast({ title: "Streaming started", color: "success" });
    } catch (err) {
      console.error("❌ Failed to start streaming:", err);
      addToast({ title: "Failed to start streaming", color: "danger" });
    }
  };

  // ---------------- get logs ----------------
  const getHistoricalLogs = async (
    logReadCharUuid: string,
    onComplete?: () => void
  ) => {
    const char = characteristics[logReadCharUuid];
    if (!char) {
      addToast({
        title: "Log characteristic not found",
        color: "warning",
      });
      return;
    }

    if (!activeDevice) {
      addToast({
        title: "No active device selected",
        color: "warning",
      });
      return;
    }

    const numericDeviceId = activeDevice.deviceId;
    const token = getToken();

    try {
      const timestamp = Math.floor(Date.now() / 1000);

      // Convert timestamp to 4-byte big-endian Uint8Array
      const buffer = new Uint8Array([
        (timestamp >> 24) & 0xff,
        (timestamp >> 16) & 0xff,
        (timestamp >> 8) & 0xff,
        timestamp & 0xff,
      ]);

      // Write timestamp to initiate log read
      await char.writeValue(buffer);
      console.log(
        "📝 Sent timestamp to log char (big-endian hex):",
        Array.from(buffer)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );

      // Read and discard the initial acknowledgment response (expected 4 bytes)
      try {
        const ackValue = await char.readValue();
        let ackHex = "";
        for (let i = 0; i < ackValue.byteLength; i++) {
          ackHex += ackValue.getUint8(i).toString(16).padStart(2, "0");
        }
        console.log(`📜 Acknowledgment response (hex): ${ackHex}`);
      } catch (err) {
        console.warn("⚠️ No acknowledgment response received:", err);
      }

      // Read up to 8 packets
      let packetCount = 0;
      const maxPackets = 8;

      while (packetCount < maxPackets) {
        try {
          const value = await char.readValue();
          let hexString = "";
          for (let i = 0; i < value.byteLength; i++) {
            hexString += value.getUint8(i).toString(16).padStart(2, "0");
          }
          console.log(`📜 Log packet ${packetCount + 1} (hex):`, hexString);

          // ✅ Check if packet is all zeros (indicating no more data)
          if (/^0+$/.test(hexString)) {
            console.log(`🛑 Packet ${packetCount + 1} is all zeros, stopping`);
            addToast({ title: "All packets collected", color: "success" });
            if (onComplete) onComplete(); // 🔥 notify UI
            break;
          }

          // Skip short responses (e.g., incomplete data)
          if (hexString.length < 480) {
            console.warn(
              `⚠️ Short response (length ${hexString.length}) for packet ${
                packetCount + 1
              }, skipping`
            );
            packetCount++;
            continue;
          }

          // Each packet is 240 bytes (480 hex chars), up to 8 measurements
          const measurements: string[] = [];
          for (let i = 0; i < 8; i++) {
            const start = i * 60;
            const measurementHex = hexString.slice(start, start + 60);
            measurements.push(measurementHex);
          }

          // Process each measurement
          for (let i = 0; i < measurements.length; i++) {
            const measurementHex = measurements[i];
            const tsHex = measurementHex.slice(0, 8);
            if (tsHex === "00000000") {
              console.log(
                `📜 Skipping invalid measurement ${i + 1} in packet ${
                  packetCount + 1
                } (timestamp 0)`
              );
              continue;
            }

            const unixTimestamp = parseTimestampHex(measurementHex);
            const batteryVoltage = parseBatteryVoltageHex(measurementHex);
            const temperature = parseTemperatureHex(measurementHex);
            const accel = parseAccelerometerHex(measurementHex);
            const frequencies = parseFrequencyHex(measurementHex);
            const amplitudes = parseAmplitudeHex(measurementHex);

            console.log(
              `📤 Sending measurement ${i + 1} from packet ${
                packetCount + 1
              } to backend:`,
              {
                deviceId: numericDeviceId,
                timestamp: unixTimestamp,
                voltage: batteryVoltage,
                temperature,
                accel,
                frequencies,
                amplitudes,
              }
            );

            // --- send to backend ---
            if (!isNaN(batteryVoltage)) {
              await fetch(`${API_BASE_URL}/api/voltage`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  voltage: batteryVoltage,
                  timestamp: unixTimestamp,
                }),
              });
            }

            if (!isNaN(temperature)) {
              await fetch(`${API_BASE_URL}/api/temperature`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  temperature,
                  timestamp: unixTimestamp,
                }),
              });
            }

            if (!isNaN(accel.x) && !isNaN(accel.y) && !isNaN(accel.z)) {
              await fetch(`${API_BASE_URL}/api/accelerometer`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  x: accel.x,
                  y: accel.y,
                  z: accel.z,
                  timestamp: unixTimestamp,
                }),
              });
            }

            if (
              !isNaN(frequencies.freq1) &&
              !isNaN(frequencies.freq2) &&
              !isNaN(frequencies.freq3) &&
              !isNaN(frequencies.freq4)
            ) {
              await fetch(`${API_BASE_URL}/api/frequency`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  freq1: frequencies.freq1,
                  freq2: frequencies.freq2,
                  freq3: frequencies.freq3,
                  freq4: frequencies.freq4,
                  timestamp: unixTimestamp,
                }),
              });
            }

            if (
              !isNaN(amplitudes.ampl1) &&
              !isNaN(amplitudes.ampl2) &&
              !isNaN(amplitudes.ampl3) &&
              !isNaN(amplitudes.ampl4)
            ) {
              await fetch(`${API_BASE_URL}/api/amplitude`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  ampl1: amplitudes.ampl1,
                  ampl2: amplitudes.ampl2,
                  ampl3: amplitudes.ampl3,
                  ampl4: amplitudes.ampl4,
                  timestamp: unixTimestamp,
                }),
              });
            }
          }

          addToast({
            title: `Packet ${packetCount + 1} arrived successfully`,
            color: "success",
          });
          packetCount++;
        } catch (err) {
          console.error(`Failed to read packet ${packetCount + 1}:`, err);
          packetCount++;
          break;
        }
      }

      // Update device time after reading logs
      if (activeDevice?.setTimeCharUuid) {
        await writeSetTime(activeDevice.setTimeCharUuid);
      }
    } catch (err) {
      console.error("Failed to start log capture:", err);
      addToast({ title: "Failed to start log capture", color: "danger" });
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
        setCharacteristics,
        writeSetTime,
        writeSleepOn,
        writeSleepOff,
        startStreaming,
        getHistoricalLogs,
      }}
    >
      {children}
    </BluetoothSensorContext.Provider>
  );
};

export const useBluetoothSensor = () => {
  const context = useContext(BluetoothSensorContext);
  if (!context)
    throw new Error(
      "useBluetoothSensor must be used within BluetoothSensorProvider"
    );
  return context;
};
