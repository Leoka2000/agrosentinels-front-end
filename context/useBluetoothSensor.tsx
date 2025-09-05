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
      addToast({ title: "Log characteristic not found", color: "warning" });
      return;
    }
    if (!activeDevice) {
      addToast({ title: "No active device selected", color: "warning" });
      return;
    }

    const numericDeviceId = activeDevice.deviceId;
    const token = getToken();

    // Packet/measurement sizes (hex chars)
    const PACKET_HEX_LEN = 480; // 240 bytes per packet
    const MEAS_HEX_LEN = 60; // 30 bytes per measurement
    const MAX_PACKETS = 8; // read up to 8 packets (as before)
    const MAX_READS_PER_PACKET = 200; // safety to avoid infinite wait

    // Buffer for assembling packets from multiple short reads
    let hexBuffer = "";

    // Simple duplicate protection within one capture run
    let lastPacketHex: string | null = null;
    const processedTimestamps = new Set<number>();

    try {
      // Kick off log read by writing current timestamp (big-endian)
      const ts = Math.floor(Date.now() / 1000);
      const initBuf = new Uint8Array([
        (ts >> 24) & 0xff,
        (ts >> 16) & 0xff,
        (ts >> 8) & 0xff,
        ts & 0xff,
      ]);
      await char.writeValue(initBuf);
      console.log(
        "📝 Sent timestamp to log char (big-endian hex):",
        Array.from(initBuf)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );

      // Optional: try reading an ACK (often a few bytes)
      try {
        const ackVal = await char.readValue();
        let ackHex = "";
        for (let i = 0; i < ackVal.byteLength; i++) {
          ackHex += ackVal.getUint8(i).toString(16).padStart(2, "0");
        }
        console.log(`📜 Acknowledgment response (hex): ${ackHex}`);
      } catch (err) {
        console.warn("⚠️ No acknowledgment response received:", err);
      }

      let packetCount = 0;

      while (packetCount < MAX_PACKETS) {
        // Assemble exactly one full packet into hexBuffer
        let readsThisPacket = 0;

        while (
          hexBuffer.length < PACKET_HEX_LEN &&
          readsThisPacket < MAX_READS_PER_PACKET
        ) {
          const value = await char.readValue();
          let hexPart = "";
          for (let i = 0; i < value.byteLength; i++) {
            hexPart += value.getUint8(i).toString(16).padStart(2, "0");
          }

          // Many devices send short 4-byte ACK frames repeatedly; ignore them when buffer is empty
          if (hexBuffer.length === 0 && hexPart.length === 8) {
            console.log(
              `ℹ️ Short ACK-like frame (${hexPart.length} hex chars) ignored before packet assembly`
            );
            readsThisPacket++;
            continue;
          }

          // Append any non-empty fragment towards the full packet
          if (hexPart.length > 0) {
            hexBuffer += hexPart;
            console.log(
              `📜 Read fragment length=${hexPart.length}, buffer now=${hexBuffer.length}`
            );
          }

          // If buffer has grown unusually large (e.g., multiple packets queued), stop inner loop
          if (hexBuffer.length >= PACKET_HEX_LEN) {
            break;
          }

          readsThisPacket++;
        }

        // If we still don't have a full packet, stop to avoid infinite loops
        if (hexBuffer.length < PACKET_HEX_LEN) {
          console.warn(
            `⚠️ Timed out waiting for full packet: bufferLen=${hexBuffer.length}, reads=${readsThisPacket}`
          );
          break;
        }

        // Process as many full packets as are currently in the buffer (usually 1)
        while (
          hexBuffer.length >= PACKET_HEX_LEN &&
          packetCount < MAX_PACKETS
        ) {
          const fullPacketHex = hexBuffer.slice(0, PACKET_HEX_LEN);
          hexBuffer = hexBuffer.slice(PACKET_HEX_LEN);

          // End-of-logs sentinel: full zeros packet
          if (/^0+$/.test(fullPacketHex)) {
            console.log(`🛑 Packet ${packetCount + 1} is all zeros, stopping`);
            addToast({ title: "All packets collected", color: "success" });
            if (onComplete) onComplete();
            // Clear buffer and end outer loop
            hexBuffer = "";
            packetCount = MAX_PACKETS;
            break;
          }

          // Skip duplicates (device may repeat the same packet multiple times)
          if (lastPacketHex && lastPacketHex === fullPacketHex) {
            console.log(
              `↩️ Duplicate packet ${packetCount + 1} detected, skipping re-insert`
            );
            packetCount++;
            continue;
          }
          lastPacketHex = fullPacketHex;

          console.log(
            `📦 Full packet ${packetCount + 1} assembled (hex length=${fullPacketHex.length})`
          );

          // Split into 8 measurement slots of 60 hex chars each
          const measurements: string[] = [];
          for (let i = 0; i < 8; i++) {
            const start = i * MEAS_HEX_LEN;
            const measurementHex = fullPacketHex.slice(
              start,
              start + MEAS_HEX_LEN
            );
            measurements.push(measurementHex);
          }

          // Process only valid slots (timestamp != 00000000 and not all zeros)
          let validReadingsCount = 0;
          for (let i = 0; i < measurements.length; i++) {
            const measurementHex = measurements[i];

            // Quick empty checks
            if (!measurementHex || measurementHex.length < MEAS_HEX_LEN)
              continue;
            if (/^0+$/.test(measurementHex)) continue;

            const tsHex = measurementHex.slice(0, 8);
            if (tsHex === "00000000") {
              console.log(
                `📜 Skipping empty measurement ${i + 1} in packet ${packetCount + 1} (timestamp 0)`
              );
              continue;
            }

            // Parse timestamp first and de-duplicate already-seen timestamps in this run
            const unixTimestamp = parseTimestampHex(measurementHex);
            if (processedTimestamps.has(unixTimestamp)) {
              console.log(
                `🧯 Duplicate timestamp ${unixTimestamp} in packet ${packetCount + 1}, skipping`
              );
              continue;
            }
            processedTimestamps.add(unixTimestamp);

            // Parse the rest
            const batteryVoltage = parseBatteryVoltageHex(measurementHex);
            const temperature = parseTemperatureHex(measurementHex);
            const accel = parseAccelerometerHex(measurementHex);
            const frequencies = parseFrequencyHex(measurementHex);
            const amplitudes = parseAmplitudeHex(measurementHex);

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

            validReadingsCount++;
          }

          addToast({
            title: `Packet ${packetCount + 1}: ${validReadingsCount} valid readings`,
            color: "success",
          });
          console.log(
            `✅ ${validReadingsCount} valid readings processed from packet ${packetCount + 1}`
          );

          packetCount++;
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
