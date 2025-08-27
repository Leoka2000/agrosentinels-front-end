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
import {
  parseAccelerometerHexData,
  parseTemperatureHex,
  parseBatteryVoltageHex,
} from "../lib/utils";
import { getToken } from "../lib/auth";

interface Device {
  id?: string;
  name?: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

interface ActiveDevice {
  deviceId: number;
  deviceName: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
  userId: number;
}

interface TemperatureData {
  temperature: number;
}

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

interface VoltageData {
  voltage: number;
  timestamp: number;
}

interface ConnectedDeviceState {
  device: Device;
  isConnected: boolean;
  temperatureData?: TemperatureData;
  accelerometerData?: AccelerometerData;
  voltageData?: VoltageData;
  lastUpdateTimestamp?: number;
}

interface BluetoothSensorContextValue {
  connectedDevices: Record<string, ConnectedDeviceState>;
  connectBluetooth: (device: Device) => Promise<void>;
  disconnectBluetooth: (deviceId: string) => Promise<void>;
  isDeviceConnected: (deviceId: string) => boolean;
  activeDevice: ActiveDevice | null;
  refreshActiveDevice: () => Promise<void>;
}

const BluetoothSensorContext =
  createContext<BluetoothSensorContextValue | null>(null);

interface BluetoothSensorProviderProps {
  children: ReactNode;
  deviceSelectionTrigger?: number; // Add this prop to listen for device changes
}

export const BluetoothSensorProvider = ({
  children,
  deviceSelectionTrigger,
}: BluetoothSensorProviderProps) => {
  const [connectedDevices, setConnectedDevices] = useState<
    Record<string, ConnectedDeviceState>
  >({});
  const [activeDevice, setActiveDevice] = useState<ActiveDevice | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  // characteristic refs per device id
  const notifyCharRefs = useRef<Record<string, BluetoothRemoteGATTCharacteristic>>({});
  const writeCharRefs = useRef<Record<string, BluetoothRemoteGATTCharacteristic>>({});
  // store the actual BluetoothDevice so we can disconnect properly
  const bluetoothDeviceRefs = useRef<Record<string, BluetoothDevice>>({});
  // browser timer id type is number
  const writeIntervals = useRef<Record<string, number>>({});

  // Fetch active device from backend
  const fetchActiveDevice = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/device/active`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  // Expose refresh function for external components
  const refreshActiveDevice = useCallback(async () => {
    await fetchActiveDevice();
  }, [fetchActiveDevice]);

  // Fetch active device on mount
  useEffect(() => {
    fetchActiveDevice();
  }, [fetchActiveDevice]);

  // Listen for device selection changes from DeviceSelect component
  useEffect(() => {
    if (deviceSelectionTrigger !== undefined && deviceSelectionTrigger > 0) {
      console.log("🔔 Device selection changed, refreshing active device...");
      fetchActiveDevice();
    }
  }, [deviceSelectionTrigger, fetchActiveDevice]);

  // Helper: robust write (choose with/without response appropriately)
  const safeWrite = useCallback(
    async (char: BluetoothRemoteGATTCharacteristic, buffer: ArrayBuffer) => {
      try {
        // Prefer writeValueWithResponse if available
        // Some browsers expose these methods as optional; use as any to call if present.
        // If not available, fallback to writeValue (legacy) or writeValueWithoutResponse.
        const anyChar = char as string;
        if (anyChar.writeValueWithResponse) {
          await anyChar.writeValueWithResponse(buffer);
          return;
        }
        if (char.properties.write) {
          await char.writeValue(buffer);
          return;
        }
        if (anyChar.writeValueWithoutResponse) {
          await anyChar.writeValueWithoutResponse(buffer);
          return;
        }
        throw new Error("Characteristic does not support write operations");
      } catch (err) {
        console.error("safeWrite failed:", err);
        throw err;
      }
    },
    []
  );

  // send a 4-byte unix timestamp (seconds). Big-endian by default; change endianness if required by MCU.
  const sendWriteRequest = useCallback(
    async (deviceId: string) => {
      const writeChar = writeCharRefs.current[deviceId];
      if (!writeChar) return;

      const unixTimestamp = Math.floor(Date.now() / 1000);
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, unixTimestamp, false); // false = big-endian; set true if MCU expects little-endian

      try {
        await safeWrite(writeChar, buffer);
      } catch (error) {
        console.error(`Write error for ${deviceId}:`, error);
      }
    },
    [safeWrite]
  );

  const startWriteInterval = useCallback(
    (deviceId: string) => {
      // if already started, skip
      if (writeIntervals.current[deviceId]) return;
      // store number returned by window.setInterval
      const id = window.setInterval(() => {
        sendWriteRequest(deviceId);
      }, 60000); // every 60s
      writeIntervals.current[deviceId] = id as unknown as number;
    },
    [sendWriteRequest]
  );

  const stopWriteInterval = useCallback((deviceId: string) => {
    const id = writeIntervals.current[deviceId];
    if (id) {
      window.clearInterval(id);
      delete writeIntervals.current[deviceId];
    }
  }, []);

  const handleCharacteristicValueChanged = useCallback(
    async (event: Event, device: Device) => {
      try {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (!value) return;

        // convert to hex string like "0x...."
        let hexString = "0x";
        for (let i = 0; i < value.byteLength; i++) {
          hexString += ("00" + value.getUint8(i).toString(16)).slice(-2);
        }
        console.log(`📦 [${device.id}] Received HEX:`, hexString);

        const parsedTemperature = parseTemperatureHex(hexString);
        const parsedAccelerometer = parseAccelerometerHexData(hexString);
        const batteryData = parseBatteryVoltageHex(hexString);

        const token = getToken();
        const timestamp = Math.floor(Date.now() / 1000);


        // IMPORTANT: Use the activeDevice's numeric deviceId instead of the Bluetooth device ID
        if (!activeDevice) {
          console.warn("⚠️ No active device found, cannot post sensor data");
          return;
        }

        const numericDeviceId = activeDevice.deviceId; // This is the numeric ID from database
        console.log(`📤 Sending sensor data for device ID: ${numericDeviceId} (${activeDevice.deviceName})`);

        // Post to backend if data exists
        // Note: we don't block UI on these; but we await so errors are catchable
        if (parsedTemperature?.temperature !== undefined) {
          fetch(`${API_BASE_URL}/api/temperature`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId: numericDeviceId, // Use numeric deviceId from database
              temperature: parsedTemperature.temperature,
              timestamp,
            }),
          })
          .then(response => {
            if (!response.ok) {
              console.error(`Temperature POST failed: ${response.status} ${response.statusText}`);
            } else {
              console.log(`✅ Temperature data sent successfully for device ${numericDeviceId}`);
            }
          })
          .catch((e) =>
            console.error("Failed to POST temperature to backend:", e)
          );
        }

        if (parsedAccelerometer) {
          fetch(`${API_BASE_URL}/api/accelerometer`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId: numericDeviceId, // Use numeric deviceId from database
              ...parsedAccelerometer,
              timestamp,
            }),
          })
          .then(response => {
            if (!response.ok) {
              console.error(`Accelerometer POST failed: ${response.status} ${response.statusText}`);
            } else {
              console.log(`✅ Accelerometer data sent successfully for device ${numericDeviceId}`);
            }
          })
          .catch((e) =>
            console.error("Failed to POST accelerometer to backend:", e)
          );
        }

        if (batteryData !== undefined) {
          fetch(`${API_BASE_URL}/api/voltage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId: numericDeviceId, // Use numeric deviceId from database
              voltage: batteryData,
              timestamp,
            }),
          })
          .then(response => {
            if (!response.ok) {
              console.error(`Voltage POST failed: ${response.status} ${response.statusText}`);
            } else {
              console.log(`✅ Voltage data sent successfully for device ${numericDeviceId}`);
            }
          })
          .catch((e) =>
            console.error("Failed to POST voltage to backend:", e)
          );
        }
      } catch (error) {
        console.error(`Error processing data for ${device.id}:`, error);
      }
    },
    [activeDevice] // Add activeDevice as dependency
  );

  const connectBluetooth = useCallback(
    async (device: Device) => {
      if (!navigator.bluetooth) {
        console.warn("Web Bluetooth not supported in this browser");
        return;
      }

      // Ensure we have an active device before connecting
      let currentActiveDevice = activeDevice;
      if (!currentActiveDevice) {
        console.log("No active device found, fetching from backend...");
        currentActiveDevice = await fetchActiveDevice();
        if (!currentActiveDevice) {
          console.error("Cannot connect: no active device available");
          return;
        }
      }

      const deviceId = device.id ?? `${device.name || "ble"}-${device.serviceUuid}-${device.readNotifyCharacteristicUuid}`;

      try {
        console.log(`🔌 Connecting via provider to ${device.name || deviceId}`);

        // Ask user to select device if no existing BluetoothDevice
        // We will try to use requestDevice to ensure user selection on the client
        const deviceFound = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [device.serviceUuid],
        });

        if (!deviceFound) {
          throw new Error("No device selected");
        }

        // store BluetoothDevice ref
        bluetoothDeviceRefs.current[deviceId] = deviceFound;

        const server = await deviceFound.gatt!.connect();
        const service = await server.getPrimaryService(device.serviceUuid);

        // fetch characteristics by UUIDs provided
        const notifyChar = await service.getCharacteristic(
          device.readNotifyCharacteristicUuid
        );
        const writeChar = await service.getCharacteristic(
          device.writeCharacteristicUuid
        );

        // save refs
        notifyCharRefs.current[deviceId] = notifyChar;
        writeCharRefs.current[deviceId] = writeChar;

        // attach listener
        const listener = (event: Event) =>
          handleCharacteristicValueChanged(event, device);
        notifyChar.addEventListener("characteristicvaluechanged", listener);
        await notifyChar.startNotifications();

        // update connection state
        setConnectedDevices((prev) => ({
          ...prev,
          [deviceId]: {
            device,
            isConnected: true,
            lastUpdateTimestamp: Math.floor(Date.now() / 1000),
          },
        }));

        // send initial write immediately and start periodic writes
        await sendWriteRequest(deviceId);
        startWriteInterval(deviceId);

        console.log(`✅ Connected (provider) to ${device.name || deviceId}`);
        console.log(`📍 Data will be sent to device ID: ${currentActiveDevice.deviceId} (${currentActiveDevice.deviceName})`);
      } catch (error) {
        console.error(`Bluetooth connection error for ${deviceId}:`, error);
        // ensure we set a disconnected state
        setConnectedDevices((prev) => ({
          ...prev,
          [deviceId]: { ...(prev[deviceId] ?? { device }), isConnected: false },
        }));
      }
    },
    [handleCharacteristicValueChanged, sendWriteRequest, startWriteInterval, activeDevice, fetchActiveDevice]
  );

  const disconnectBluetooth = useCallback(
    async (deviceId: string) => {
      console.log(`🔌 Disconnecting ${deviceId}`);
      stopWriteInterval(deviceId);

      const notifyChar = notifyCharRefs.current[deviceId];
      if (notifyChar) {
        try {
          await notifyChar.stopNotifications();
          notifyChar.removeEventListener("characteristicvaluechanged", () => {});
        } catch (err) {
          console.warn(`Stop notifications error for ${deviceId}:`, err);
        }
        delete notifyCharRefs.current[deviceId];
      }

      // Disconnect GATT device if we have it
      const btDevice = bluetoothDeviceRefs.current[deviceId];
      if (btDevice && btDevice.gatt && btDevice.gatt.connected) {
        try {
          btDevice.gatt.disconnect();
        } catch (err) {
          console.warn("Error disconnecting GATT device:", err);
        }
      }
      delete bluetoothDeviceRefs.current[deviceId];
      delete writeCharRefs.current[deviceId];

      setConnectedDevices((prev) => ({
        ...prev,
        [deviceId]: { ...prev[deviceId], isConnected: false },
      }));
    },
    [stopWriteInterval]
  );

  const isDeviceConnected = useCallback(
    (deviceId: string) => !!connectedDevices[deviceId]?.isConnected,
    [connectedDevices]
  );

  // cleanup on unmount
  useEffect(() => {
    return () => {
      // clear intervals and disconnect devices
      Object.keys(writeIntervals.current).forEach((id) => {
        window.clearInterval(writeIntervals.current[id]);
      });
      Object.keys(bluetoothDeviceRefs.current).forEach((id) => {
        const bt = bluetoothDeviceRefs.current[id];
        try {
          if (bt && bt.gatt && bt.gatt.connected) bt.gatt.disconnect();
        } catch {}
      });
    };
  }, []);

  return (
    <BluetoothSensorContext.Provider
      value={{
        connectedDevices,
        connectBluetooth,
        disconnectBluetooth,
        isDeviceConnected,
        activeDevice,
        refreshActiveDevice,
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