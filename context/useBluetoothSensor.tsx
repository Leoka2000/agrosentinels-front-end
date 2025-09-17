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
import { logspostMetrics } from "@/lib/logs-postmetrics";
import { streamPostMetrics } from "@/lib/stream-postmetrics";
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
import { useBluetoothDevice } from "@/context/BluetoothDeviceContext";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";

//  describes the device that we connect to bluetooth
// it holds identifiers and characteristics needed to read or write data
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

// this describes the latest metrics (values) that we read from the device
// it includes things like temperature, voltage, acceleration, etc
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

// minimal description of a bluetooth device as seen by the browser to be used by the chrome web bluetooth api
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: any;
}
// shape of a bluetooth gatt characteristic object in the browser
type BluetoothRemoteGATTCharacteristic = {
  uuid: string;
  startNotifications: () => Promise<void>;
  stopNotifications?: () => Promise<void>;
  addEventListener: (type: string, listener: (event: any) => void) => void;
  removeEventListener: (type: string, listener: (event: any) => void) => void;
  writeValue: (value: BufferSource) => Promise<void>;
  readValue: () => Promise<DataView>;
};

// this defines everything that will be available through the context
// components can call these functions or read these values
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

// context object that will hold our bluetooth state and functions
const BluetoothSensorContext =
  createContext<BluetoothSensorContextValue | null>(null);
// provider component that wraps around the app and gives access to the context
interface BluetoothSensorProviderProps {
  children: ReactNode;
  deviceSelectionTrigger?: number;
}

export const BluetoothSensorProvider = ({
  children,
  deviceSelectionTrigger,
}: BluetoothSensorProviderProps) => {
  // state to track the active device and its connection status
  const { setLoadingFor } = useGlobalLoading();
  const [activeDevice, setActiveDevice] = useState<ActiveDevice | null>(null);
  const [localConnected, setLocalConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<BluetoothDevice | null>(
    null
  );
  // latest metrics and parsed message shown in ui
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
  // external hook providing info about page and refresh state
  const { page, refreshTrigger } = useBluetoothDevice();

  // ref to store interval for streaming, so we can clear it later
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  

  // ---------------- fetch active device logic ----------------
  const fetchActiveDevice = useCallback(async () => {
    if (!token) return null; // dontt fetch without a valid token

    try {
      const response = await fetch(`${API_BASE_URL}/api/device/active`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch active device. Status: ${response.status}`
        );
        setActiveDevice(null);
        setDeviceMetrics(null);
       setLoadingFor("bluetooth", false);
        return null;
      }

      // handle empty responses so the app does not crash
      const text = await response.text();
      if (!text) {
        console.warn("Active device response body was empty");
        setActiveDevice(null);
        setDeviceMetrics(null);
     setLoadingFor("bluetooth", false);
        return null;
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error(
          "Failed to parse active device response as JSON:",
          parseError
        );
        setActiveDevice(null);
        setDeviceMetrics(null);
        return null;
      }

      // map server response into ActiveDevice object
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

      // map into DeviceMetrics object for latest values
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
    } finally {
    setLoadingFor("bluetooth", false); // ✅ hydration complete
    }
  }, [API_BASE_URL, token, page, refreshTrigger]);

  useEffect(() => {
    if (token) {
      console.log(`🔄 Page changed to: ${page}, fetching active device...`); // keep active device up to date
      fetchActiveDevice(); //  when page or trigger changes
    }
  }, [page, token, fetchActiveDevice, refreshTrigger]);

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

  // ---------------- bluetooth logic connectio.n logic ----------------
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

  // ---------------- stop streaming ----------------
  const stopStreaming = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
      console.log("Streaming stopped and interval cleared");
      addToast({ title: "Streaming stopped", color: "warning" });
    }
  };

  // ---------------- disconnect  ----------------
  const disconnectBluetooth = () => {
    stopStreaming(); // make sure we stop any ongoing streaming
    if (currentDevice?.gatt?.connected) currentDevice.gatt.disconnect();
    setLocalConnected(false);
    setCurrentDevice(null);
    setCharacteristics({});
    addToast({ title: "Disconnected", color: "warning" });
  };

  // ---------------- write current time to device ----------------
  const writeSetTime = async (setTimeCharUuid: string): Promise<void> => {
    const char = characteristics[setTimeCharUuid];
    if (!char) {
      addToast({
        title: "Set Time characteristic not found",
        color: "warning",
      });
      return;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000); // current unix time OF NOW.
    const buffer = new ArrayBuffer(4); // this is the timestamp we send to ....44444
    const view = new DataView(buffer); // to the device to CONFIGURE ITS CLOCK
    view.setUint32(0, currentTimestamp, false); // big-endian

    try {
      await char.writeValue(buffer);
      addToast({ title: "Current timestamp sent", color: "success" });
      console.log(
        "⏰ Timestamp sent (big-endian hex):",
        currentTimestamp,
        Array.from(new Uint8Array(buffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    } catch (err) {
      console.error("Failed to write timestamp:", err);
      addToast({ title: "Failed to write timestamp", color: "danger" });
    }
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
    await char.writeValue(Uint8Array.of(0x4e)); // command to wake the device up
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
    await char.writeValue(Uint8Array.of(0x46)); // command to put device to sleep
    addToast({ title: "Sleep OFF sent", color: "success" });
  };

  // ---------------- Start streaming ----------------
  const startStreaming = async (): Promise<void> => {
    if (!activeDevice) return;
    if (!token) {
      addToast({
        title: "Authentication required",
        color: "danger",
      });
      console.warn("❌ No token available, aborting streaming.");
      return;
    }

    const measurementChar = characteristics[activeDevice.measurementCharUuid];
    const setTimeChar = characteristics[activeDevice.setTimeCharUuid];

    if (!measurementChar || !setTimeChar) {
      addToast({
        title: "Required characteristics not found",
        color: "warning",
      });
      return;
    }

    try {
      // clear any existing interval that may be running alresdy
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
      // send current time to device before starting stream.
      const currentTimestamp = Math.floor(Date.now() / 1000); // TODO: REMOVE THIS. we dont need to send the timestamp AGAIN
      const buffer = new ArrayBuffer(4);
      new DataView(buffer).setUint32(0, currentTimestamp, false); // big-endian
      await setTimeChar.writeValue(buffer);
      console.log("⏰ Timestamp sent to MCU:", currentTimestamp);
      // wait a lil moment before enabling notifications
      await new Promise((resolve) => setTimeout(resolve, 50));
      await measurementChar.startNotifications();

      // listen to notifications, start being notified of streaming live data
      measurementChar.addEventListener(
        "characteristicvaluechanged",
        async (event: any) => {
          try {
            const value: DataView = event.target.value;
            let hexString = "";
            for (let i = 0; i < value.byteLength; i++) {
              hexString += value.getUint8(i).toString(16).padStart(2, "0");
            }

            const numericDeviceId = activeDevice.deviceId;

            // parse values from hex string to human readable numbers
            const unixTimestamp = parseTimestampHex(hexString);
            const batteryVoltage = parseBatteryVoltageHex(hexString);
            const temperature = parseTemperatureHex(hexString);
            const accel = parseAccelerometerHex(hexString);
            const frequencies = parseFrequencyHex(hexString);
            const amplitudes = parseAmplitudeHex(hexString);
            // update state with the new values
            setDeviceMetrics((prev) => ({
              ...prev,
              deviceId: numericDeviceId,
              deviceName: activeDevice.deviceName,
              userId: activeDevice.userId,
              registeredDevice: activeDevice.registeredDevice,
              lastReceivedTimestamp: unixTimestamp,
              latestTemperature: temperature,
              latestVoltage: batteryVoltage,
              latestAccelX: accel.x,
              latestAccelY: accel.y,
              latestAccelZ: accel.z,
              latestFreq1: frequencies.freq1,
              latestFreq2: frequencies.freq2,
              latestFreq3: frequencies.freq3,
              latestFreq4: frequencies.freq4,
              latestAmpl1: amplitudes.ampl1,
              latestAmpl2: amplitudes.ampl2,
              latestAmpl3: amplitudes.ampl3,
              latestAmpl4: amplitudes.ampl4,
            }));

            // send data to backend api
            await streamPostMetrics(
              API_BASE_URL,
              token,
              numericDeviceId,
              unixTimestamp,
              {
                batteryVoltage,
                temperature,
                accel,
                frequencies,
                amplitudes,
              }
            );
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

  // ---------------- get logs, read historical data from flash memory ----------------

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
    if (!token) {
      addToast({ title: "Authentication required", color: "danger" });
      console.warn("❌ No token available, aborting historical log fetch.");
      return;
    }

    const numericDeviceId = activeDevice.deviceId;

    const PACKET_HEX_LEN = 480; // full log packet = 240 bytes
    const MEAS_HEX_LEN = 60; // single measurement = 30 bytes
    const MAX_PACKETS = 8; // maximum amount of packets in one data package sent
    const MAX_READS_PER_PACKET = 200;
    const TIMEOUT_MS = 20000; // allow 20s instead of 10s

    let hexBuffer = "";
    let lastPacketHex: string | null = null;
    const processedTimestamps = new Set<number>();
    let packetCount = 0;
    let stop = false;

    const timeout = setTimeout(() => {
      console.warn("⏰ Log fetch timed out.");
      stop = true;
    }, TIMEOUT_MS);

    try {
      // send init timestamp. THIS WILL BE CHANGED LATER. THE USER MUST CHOSE FROM WHEN HE WANTS TO START READING THE LOGS
      const ts = Math.floor(Date.now() / 1000);
      const initBuf = new Uint8Array([
        (ts >> 24) & 0xff,
        (ts >> 16) & 0xff,
        (ts >> 8) & 0xff,
        ts & 0xff,
      ]);
      await char.writeValue(initBuf);
      console.log("📝 Sent timestamp to log char");

      //foR some reason the device keeps sending short ack-like frames so I made
      try {
        // this function to ignore them and parse only the actual relevant data
        const ackVal = await char.readValue();
        let ackHex = "";
        for (let i = 0; i < ackVal.byteLength; i++) {
          ackHex += ackVal.getUint8(i).toString(16).padStart(2, "0");
        }
        console.log(`📜 Acknowledgment response (hex): ${ackHex}`);
      } catch (err) {
        console.warn("⚠️ No acknowledgment response received:", err);
      }

      // main packet loop
      while (packetCount < MAX_PACKETS && !stop) {
        let readsThisPacket = 0;

        while (
          hexBuffer.length < PACKET_HEX_LEN &&
          readsThisPacket < MAX_READS_PER_PACKET &&
          !stop
        ) {
          const value = await char.readValue();
          let hexPart = "";
          for (let i = 0; i < value.byteLength; i++) {
            hexPart += value.getUint8(i).toString(16).padStart(2, "0");
          }

          if (hexPart.length === 8) {
            console.log("↩️ ACK frame ignored:", hexPart);
            readsThisPacket++;
            // small delay to give MCU time to prepare full packet
            await new Promise((res) => setTimeout(res, 50));
            continue;
          }

          // accumulate real data
          if (hexPart.length > 0) {
            hexBuffer += hexPart;
          }
          readsThisPacket++;
        }

        if (hexBuffer.length < PACKET_HEX_LEN) {
          console.warn("⚠️ Incomplete packet, waiting for more data...");
          // allow next loop iteration to fetch more instead of breaking. CURRENTLY NOT WORKING
          continue;
        }

        // process full packets thatb we got
        while (
          hexBuffer.length >= PACKET_HEX_LEN &&
          packetCount < MAX_PACKETS &&
          !stop
        ) {
          const fullPacketHex = hexBuffer.slice(0, PACKET_HEX_LEN);
          hexBuffer = hexBuffer.slice(PACKET_HEX_LEN);

          if (/^0+$/.test(fullPacketHex)) {
            console.log(`🛑 Packet ${packetCount + 1} is all zeros.`);
            if (onComplete) onComplete();
            hexBuffer = "";
            packetCount = MAX_PACKETS; // exit function when we get only zeros.
            break; // meaning no more logs and no need to continue running tbis fuznction
          }

          if (lastPacketHex && lastPacketHex === fullPacketHex) {
            console.log(`↩️ Duplicate packet ${packetCount + 1}, skipping`);
            packetCount++;
            continue;
          }
          lastPacketHex = fullPacketHex;

          if (onPacketReceived) onPacketReceived(fullPacketHex);

          const measurements: string[] = [];
          for (let i = 0; i < 8; i++) {
            const start = i * MEAS_HEX_LEN;
            measurements.push(fullPacketHex.slice(start, start + MEAS_HEX_LEN));
          }

          let validReadingsCount = 0;
          let packetFormattedMessages: string[] = [];

          for (const measurementHex of measurements) {
            if (!measurementHex || measurementHex.length < MEAS_HEX_LEN)
              continue;
            if (/^0+$/.test(measurementHex)) continue;

            const tsHex = measurementHex.slice(0, 8);
            if (tsHex === "00000000") continue;

            const unixTimestamp = parseTimestampHex(measurementHex);
            if (processedTimestamps.has(unixTimestamp)) continue;
            processedTimestamps.add(unixTimestamp);

            const batteryVoltage = parseBatteryVoltageHex(measurementHex);
            const temperature = parseTemperatureHex(measurementHex);
            const accel = parseAccelerometerHex(measurementHex);
            const frequencies = parseFrequencyHex(measurementHex);
            const amplitudes = parseAmplitudeHex(measurementHex);

            setDeviceMetrics((prev) => ({
              //update state related to latest values measured.

              ...prev,
              deviceId: numericDeviceId,
              deviceName: activeDevice.deviceName,
              userId: activeDevice.userId,
              registeredDevice: activeDevice.registeredDevice,
              lastReceivedTimestamp: unixTimestamp,
              latestTemperature: temperature,
              latestVoltage: batteryVoltage,
              latestAccelX: accel.x,
              latestAccelY: accel.y,
              latestAccelZ: accel.z,
              latestFreq1: frequencies.freq1,
              latestFreq2: frequencies.freq2,
              latestFreq3: frequencies.freq3,
              latestFreq4: frequencies.freq4,
              latestAmpl1: amplitudes.ampl1,
              latestAmpl2: amplitudes.ampl2,
              latestAmpl3: amplitudes.ampl3,
              latestAmpl4: amplitudes.ampl4,
            }));

            packetFormattedMessages.push(
              formatParsedMeasurementMessage(measurementHex)
            );
            // send data to backend api
            await logspostMetrics(
              API_BASE_URL,
              token,
              numericDeviceId,
              unixTimestamp,
              {
                batteryVoltage,
                temperature,
                accel,
                frequencies,
                amplitudes,
              }
            );

            validReadingsCount++;
          }

          setLatestParsedMessage(packetFormattedMessages.join("\n\n"));
          addToast({
            title: `Packet ${packetCount + 1}: ${validReadingsCount} valid readings`,
            color: "success",
          });
          packetCount++;
        }
      }
    } catch (err) {
      console.error("Failed to start log capture:", err);
      addToast({ title: "Failed to start log capture", color: "danger" });
    } finally {
      clearTimeout(timeout);
      if (onComplete) onComplete();
      console.log(`✅ Log fetch ended. Packets collected: ${packetCount}`);
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
