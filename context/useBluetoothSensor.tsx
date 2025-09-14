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
import { useAuth } from "./AuthContext";
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
  lastReceivedTimestamp?: number;
}

interface DeviceMetrics {
  deviceId: number;
  deviceName: string;
  userId: number;
  registeredDevice: boolean;
  lastReceivedTimestamp?: number;
  latestTemperature?: number | null;
  latestVoltage?: number | null;
  latestAccelX?: number | null;
  latestAccelY?: number | null;
  latestAccelZ?: number | null;
  latestFreq1?: number | null;
  latestFreq2?: number | null;
  latestFreq3?: number | null;
  latestFreq4?: number | null;
  latestAmpl1?: number | null;
  latestAmpl2?: number | null;
  latestAmpl3?: number | null;
  latestAmpl4?: number | null;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: any;
}

type BluetoothRemoteGATTCharacteristic = {
  uuid: string;
  startNotifications: () => Promise<void>;
  stopNotifications?: () => Promise<void>;
  addEventListener: (type: string, listener: (event: any) => void) => void;
  removeEventListener: (type: string, listener: (event: any) => void) => void;
  writeValue: (value: BufferSource) => Promise<void>;
  readValue: () => Promise<DataView>;
};

interface BluetoothSensorContextValue {
  activeDevice: ActiveDevice | null;
  deviceMetrics: DeviceMetrics | null;
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
  getHistoricalLogs: (
    logReadCharUuid: string,
    onComplete?: () => void,
    onPacketReceived?: (hexString: string) => void
  ) => Promise<void>;
  latestParsedMessage: string | null;
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
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics | null>(
    null
  );
  const { token } = useAuth();
  const [characteristics, setCharacteristics] = useState<
    Record<string, BluetoothRemoteGATTCharacteristic>
  >({});
  const [latestParsedMessage, setLatestParsedMessage] = useState<string | null>(
    null
  );

  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // ---------------- fetch active device logic ----------------
  const fetchActiveDevice = useCallback(async () => {
    if (!token) return null; // 🚀 don't call API without token
    try {
      const response = await fetch(`${API_BASE_URL}/api/device/active`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();

      // Map response to ActiveDevice and DeviceMetrics
      const activeDeviceObj: ActiveDevice = {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        userId: data.userId,
        serviceUuid: data.serviceUuid,
        measurementCharUuid: data.measurementCharUuid,
        alarmCharUuid: data.alarmCharUuid,
        ledControlCharUuid: data.ledControlCharUuid,
        logReadCharUuid: data.logReadCharUuid,
        setTimeCharUuid: data.setTimeCharUuid,
        sleepControlCharUuid: data.sleepControlCharUuid,
        registeredDevice: data.registeredDevice,
        lastReceivedTimestamp: data.lastReceivedTimestamp,
      };
      setActiveDevice(activeDeviceObj);

      const metrics: DeviceMetrics = {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        userId: data.userId,
        registeredDevice: data.registeredDevice,
        lastReceivedTimestamp: data.lastReceivedTimestamp,
        latestTemperature: data.latestTemperature,
        latestVoltage: data.latestVoltage,
        latestAccelX: data.latestAccelX,
        latestAccelY: data.latestAccelY,
        latestAccelZ: data.latestAccelZ,
        latestFreq1: data.latestFreq1,
        latestFreq2: data.latestFreq2,
        latestFreq3: data.latestFreq3,
        latestFreq4: data.latestFreq4,
        latestAmpl1: data.latestAmpl1,
        latestAmpl2: data.latestAmpl2,
        latestAmpl3: data.latestAmpl3,
        latestAmpl4: data.latestAmpl4,
      };
      setDeviceMetrics(metrics);
      console.log("📊 Device metrics updated:", metrics);

      return data;
    } catch (error) {
      console.error("Error fetching active device:", error);
      setActiveDevice(null);
      setDeviceMetrics(null);
      return null;
    }
  }, [API_BASE_URL, token]);

  const refreshActiveDevice = useCallback(async () => {
    await fetchActiveDevice();
  }, [fetchActiveDevice]);
  useEffect(() => {
    if (token) {
      fetchActiveDevice();
    }
  }, [token, fetchActiveDevice]);

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

    if (!activeDevice) return;

    // Use lastReceivedTimestamp if available, otherwise fallback to current time
    const unixTimestamp =
      activeDevice.lastReceivedTimestamp ?? Math.floor(Date.now() / 1000);

    // Convert to 4-byte big-endian
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, unixTimestamp, false); // false = big-endian

    await char.writeValue(buffer);
    addToast({ title: "Timestamp sent (big-endian)", color: "success" });
    console.log(
      "⏰ Timestamp sent (big-endian):",
      unixTimestamp,
      "hex=",
      Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  };

  // ---------------- Sleep Control ----------------
  const writeSleepOn = async (sleepControlCharUuid: string): Promise<void> => {
    const char = characteristics[sleepControlCharUuid];
    if (!char) {
      addToast({
        title: "Sleep Control characteristic not found",
        color: "warning",
      });
      return;
    }
    await char.writeValue(Uint8Array.of(0x4e)); // Sleep ON
    addToast({ title: "Sleep ON sent", color: "success" });
  };

  const writeSleepOff = async (sleepControlCharUuid: string): Promise<void> => {
    const char = characteristics[sleepControlCharUuid];
    if (!char) {
      addToast({
        title: "Sleep Control characteristic not found",
        color: "warning",
      });
      return;
    }
    await char.writeValue(Uint8Array.of(0x46)); // Sleep OFF
    addToast({ title: "Sleep OFF sent", color: "success" });
  };

  // ---------------- Start streaming ----------------
  const startStreaming = async (): Promise<void> => {
    if (!activeDevice) return;
    const measurementChar = characteristics[activeDevice.measurementCharUuid];
    const setTimeChar = characteristics[activeDevice.setTimeCharUuid];

    if (!measurementChar || !setTimeChar) {
      console.error("🔹 Characteristics currently available:", characteristics);
      addToast({
        title: "Required characteristics not found",
        color: "warning",
      });
      return;
    }

    try {
      // Stop any existing streaming interval
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }

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

            const numericDeviceId = activeDevice.deviceId;
            

            // Parse timestamp & sensor values
            const unixTimestamp = parseTimestampHex(hexString);
            const batteryVoltage = parseBatteryVoltageHex(hexString);
            const temperature = parseTemperatureHex(hexString);
            const accel = parseAccelerometerHex(hexString);
            const frequencies = parseFrequencyHex(hexString);
            const amplitudes = parseAmplitudeHex(hexString);

            // ---------------- Update backend last-received timestamp ----------------
            await fetch(
              `${API_BASE_URL}/api/device/${numericDeviceId}/last-timestamp?timestamp=${unixTimestamp}`,
              {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            // Update locally
            setActiveDevice((prev) =>
              prev ? { ...prev, lastReceivedTimestamp: unixTimestamp } : prev
            );

            // ---------------- Write timestamp back to device ----------------
            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            view.setUint32(0, unixTimestamp, false); // big-endian
            await setTimeChar.writeValue(buffer);
            console.log(
              "⏰ Write timestamp to device (hex):",
              unixTimestamp,
              Array.from(new Uint8Array(buffer))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
            );

            // ---------------- PATCH: update latest values ----------------
            await fetch(`${API_BASE_URL}/api/device/update-latest`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                deviceId: numericDeviceId,
                temperature,
                voltage: batteryVoltage,
                accelX: accel.x,
                accelY: accel.y,
                accelZ: accel.z,
                freq1: frequencies.freq1,
                freq2: frequencies.freq2,
                freq3: frequencies.freq3,
                freq4: frequencies.freq4,
                ampl1: amplitudes.ampl1,
                ampl2: amplitudes.ampl2,
                ampl3: amplitudes.ampl3,
                ampl4: amplitudes.ampl4,
              }),
            });

            // ---------------- Optional: store historical data ----------------
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
    onComplete?: () => void,
    onPacketReceived?: (hexString: string) => void
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
  

    const PACKET_HEX_LEN = 480; // 240 bytes * 2 hex chars
    const MEAS_HEX_LEN = 60; // 30 bytes per measurement slot
    const MAX_PACKETS = 8;
    const MAX_READS_PER_PACKET = 200;

    let hexBuffer = "";
    let lastPacketHex: string | null = null;
    const processedTimestamps = new Set<number>();

    try {
      // Send init timestamp
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

          console.log(
            `📡 Raw BLE data fragment (length=${value.byteLength} bytes):`,
            hexPart
          );

          if (hexBuffer.length === 0 && hexPart.length === 8) {
            console.log("Short ACK-like frame ignored:", hexPart);
            readsThisPacket++;
            continue;
          }

          if (hexPart.length > 0) hexBuffer += hexPart;
          readsThisPacket++;
        }

        if (hexBuffer.length < PACKET_HEX_LEN) {
          console.warn(
            `⚠️ Timed out waiting for full packet: buffer length=${hexBuffer.length}, reads=${readsThisPacket}`
          );
          break;
        }

        while (
          hexBuffer.length >= PACKET_HEX_LEN &&
          packetCount < MAX_PACKETS
        ) {
          const fullPacketHex = hexBuffer.slice(0, PACKET_HEX_LEN);
          hexBuffer = hexBuffer.slice(PACKET_HEX_LEN);

          // ---------- All Zeros = End Historical, Start Patch Streaming ----------
          if (/^0+$/.test(fullPacketHex)) {
            console.log(`🛑 Packet ${packetCount + 1} is all zeros.`);
            console.log(
              "🔄 Switching from getHistoricalLogs → startStreaming (patch mode)"
            );

            if (activeDevice?.measurementCharUuid) {
              const measurementChar =
                characteristics[activeDevice.measurementCharUuid];
              const setTimeChar = characteristics[activeDevice.setTimeCharUuid];

              if (measurementChar && setTimeChar) {
                await measurementChar.startNotifications();

                const handler = async (event: any) => {
                  try {
                    const value: DataView = event.target.value;
                    let hexString = "";
                    for (let i = 0; i < value.byteLength; i++) {
                      hexString += value
                        .getUint8(i)
                        .toString(16)
                        .padStart(2, "0");
                    }
                    console.log(
                      "📡 One-time stream packet (for patch):",
                      hexString
                    );

                    const unixTimestamp = parseTimestampHex(hexString);

                    // Write timestamp back to device
                    const buffer = new ArrayBuffer(4);
                    const view = new DataView(buffer);
                    view.setUint32(0, unixTimestamp, false);
                    await setTimeChar.writeValue(buffer);

                    console.log(
                      "✅ Timestamp patched with stream packet:",
                      unixTimestamp
                    );

                    // Cleanup after one cycle
                    measurementChar.removeEventListener(
                      "characteristicvaluechanged",
                      handler
                    );
                    if (
                      typeof measurementChar.stopNotifications === "function"
                    ) {
                      await measurementChar.stopNotifications();
                    }

                    if (onComplete) onComplete();
                  } catch (err) {
                    console.error("❌ Error during patch streaming:", err);
                  }
                };

                measurementChar.addEventListener(
                  "characteristicvaluechanged",
                  handler
                );
              }
            }

            hexBuffer = "";
            packetCount = MAX_PACKETS; // force exit
            break;
          }

          // ---------- Duplicate Packet ----------
          if (lastPacketHex && lastPacketHex === fullPacketHex) {
            console.log(`↩️ Duplicate packet ${packetCount + 1}, skipping`);
            packetCount++;
            continue;
          }
          lastPacketHex = fullPacketHex;

          console.log(
            `📦 Full packet ${packetCount + 1} assembled (hex length=${fullPacketHex.length})`
          );

          if (onPacketReceived) onPacketReceived(fullPacketHex);

          // ---------- Parse Measurements ----------
          const measurements: string[] = [];
          for (let i = 0; i < 8; i++) {
            const start = i * MEAS_HEX_LEN;
            measurements.push(fullPacketHex.slice(start, start + MEAS_HEX_LEN));
          }

          let validReadingsCount = 0;
          let packetFormattedMessages: string[] = [];

          for (let i = 0; i < measurements.length; i++) {
            const measurementHex = measurements[i];
            if (!measurementHex || measurementHex.length < MEAS_HEX_LEN)
              continue;
            if (/^0+$/.test(measurementHex)) continue;

            const tsHex = measurementHex.slice(0, 8);
            if (tsHex === "00000000") {
              console.log(
                `📜 Skipping empty measurement ${i + 1} in packet ${packetCount + 1}`
              );
              continue;
            }

            const unixTimestamp = parseTimestampHex(measurementHex);
            if (processedTimestamps.has(unixTimestamp)) {
              console.log(`🧯 Duplicate timestamp ${unixTimestamp}, skipping`);
              continue;
            }
            processedTimestamps.add(unixTimestamp);

            const batteryVoltage = parseBatteryVoltageHex(measurementHex);
            const temperature = parseTemperatureHex(measurementHex);
            const accel = parseAccelerometerHex(measurementHex);
            const frequencies = parseFrequencyHex(measurementHex);
            const amplitudes = parseAmplitudeHex(measurementHex);

            // Format for UI
            packetFormattedMessages.push(
              formatParsedMeasurementMessage(measurementHex)
            );

            // Push to backend APIs
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
                  ...accel,
                  timestamp: unixTimestamp,
                }),
              });
            }
            if (!isNaN(frequencies.freq1)) {
              await fetch(`${API_BASE_URL}/api/frequency`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  ...frequencies,
                  timestamp: unixTimestamp,
                }),
              });
            }
            if (!isNaN(amplitudes.ampl1)) {
              await fetch(`${API_BASE_URL}/api/amplitude`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: numericDeviceId,
                  ...amplitudes,
                  timestamp: unixTimestamp,
                }),
              });
            }

            validReadingsCount++;
          }

          setLatestParsedMessage(packetFormattedMessages.join("\n\n"));
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
    } catch (err) {
      console.error("Failed to start log capture:", err);
      addToast({ title: "Failed to start log capture", color: "danger" });
    }
  };

  function formatParsedMeasurementMessage(hexString: string): string {
    const unixTimestamp = parseTimestampHex(hexString);
    const batteryVoltage = parseBatteryVoltageHex(hexString);
    const temperature = parseTemperatureHex(hexString);
    const accel = parseAccelerometerHex(hexString);
    const frequencies = parseFrequencyHex(hexString);
    const amplitudes = parseAmplitudeHex(hexString);

    const date = new Date(unixTimestamp * 1000).toLocaleString();

    return [
      `📅 Timestamp: ${date}`,
      `🌡️ Temp raw=0x${hexString.slice(8, 12)} -> ${temperature.toFixed(1)} °C`,
      `🔋 Battery voltage: ${batteryVoltage.toFixed(3)} V`,
      `📏 Accelerometer values -> X: ${accel.x}, Y: ${accel.y}, Z: ${accel.z}`,
      `🎵 Frequencies -> F1: ${frequencies.freq1} Hz, F2: ${frequencies.freq2} Hz, F3: ${frequencies.freq3} Hz, F4: ${frequencies.freq4} Hz`,
      `📈 Amplitudes -> A1: ${amplitudes.ampl1} mV, A2: ${amplitudes.ampl2} mV, A3: ${amplitudes.ampl3} mV, A4: ${amplitudes.ampl4} mV`,
    ].join("\n");
  }

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
        latestParsedMessage,
        deviceMetrics,
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
