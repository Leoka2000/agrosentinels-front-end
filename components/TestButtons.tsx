"use client";

import React from "react";
import { Button } from "@heroui/button";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import {
  parseTimestampHex,
  parseBatteryVoltageHex,
  parseTemperatureHex,
  parseAccelerometerHex,
  parseFrequencyHex,
  parseAmplitudeHex,
} from "../lib/utils";

// Helper function to generate a single 30-byte reading
const generateReading = (timestamp: number): Uint8Array => {
  const buffer = new ArrayBuffer(30);
  const view = new DataView(buffer);

  // Timestamp (4 bytes, big-endian, Unix timestamp)
  view.setUint32(0, timestamp, false);

  // Battery Voltage (4 bytes, float, ~3.7V)
  view.setFloat32(4, 3.7 + Math.random() * 0.1, false);

  // Temperature (4 bytes, float, ~25-30°C)
  view.setFloat32(8, 25 + Math.random() * 5, false);

  // Accelerometer (6 bytes: x, y, z, int16, -1000 to 1000)
  view.setInt16(12, Math.floor(Math.random() * 2000 - 1000), false); // x
  view.setInt16(14, Math.floor(Math.random() * 2000 - 1000), false); // y
  view.setInt16(16, Math.floor(Math.random() * 2000 - 1000), false); // z

  // Frequencies (8 bytes: freq1-4, uint16, 100-2000 Hz)
  view.setUint16(18, Math.floor(100 + Math.random() * 1900), false); // freq1
  view.setUint16(20, Math.floor(100 + Math.random() * 1900), false); // freq2
  view.setUint16(22, Math.floor(100 + Math.random() * 1900), false); // freq3
  view.setUint16(24, Math.floor(100 + Math.random() * 1900), false); // freq4

  // Amplitudes (4 bytes: ampl1-4, uint8, 0-255)
  view.setUint8(26, Math.floor(Math.random() * 256)); // ampl1
  view.setUint8(27, Math.floor(Math.random() * 256)); // ampl2
  view.setUint8(28, Math.floor(Math.random() * 256)); // ampl3
  view.setUint8(29, Math.floor(Math.random() * 256)); // ampl4

  return new Uint8Array(buffer);
};

// Helper function to generate a 240-byte packet with N readings
const generatePacket = (numReadings: number, timestamp: number): Uint8Array => {
  const buffer = new ArrayBuffer(240);
  const view = new DataView(buffer);

  // Fill with readings (30 bytes each)
  for (let i = 0; i < numReadings; i++) {
    const reading = generateReading(timestamp - i * 60); // Offset timestamp for realism
    for (let j = 0; j < 30; j++) {
      view.setUint8(i * 30 + j, reading[j]);
    }
  }

  // Pad with zeros if fewer than 8 readings
  for (let i = numReadings * 30; i < 240; i++) {
    view.setUint8(i, 0);
  }

  return new Uint8Array(buffer);
};

// Helper function to convert Uint8Array to hex string
const toHexString = (data: Uint8Array): string => {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Mock UUIDs and deviceId for testing without a device
const mockLogReadCharUuid = "00002a00-0000-1000-8000-00805f9b34fb";
const mockMeasurementCharUuid = "00002a01-0000-1000-8000-00805f9b34fb";
const mockDeviceId = 1;

interface TestButtonsProps {
  onPacketReceived?: (packetHex: string) => void;
}

const TestButtons: React.FC<TestButtonsProps> = ({ onPacketReceived }) => {
  const {
    activeDevice,
    characteristics,
    setCharacteristics,
    getHistoricalLogs,
    startStreaming,
  } = useBluetoothSensor();

  // Test handler for ...7777 channel (0-8 readings)
  const handleTest7777 = async (numReadings: number) => {
    const logReadCharUuid = activeDevice?.logReadCharUuid || mockLogReadCharUuid;
    const deviceId = activeDevice?.deviceId || mockDeviceId;

    // Create mock characteristic
    let readCount = 0;
    const timestamp = Math.floor(Date.now() / 1000);
    const ackBuffer = new Uint8Array(4);
    ackBuffer[0] = (timestamp >> 24) & 0xff;
    ackBuffer[1] = (timestamp >> 16) & 0xff;
    ackBuffer[2] = (timestamp >> 8) & 0xff;
    ackBuffer[3] = timestamp & 0xff;
    const packetData =
      numReadings === 0
        ? new Uint8Array(240).fill(0)
        : generatePacket(numReadings, timestamp);

    // Log the packet data
    const packetHex = toHexString(packetData);
    console.log(`📜 Test ...7777 (${numReadings} readings) packet (hex):`, packetHex);

    // Parse and log values to be sent to backend
    if (numReadings > 0) {
      const measurements: string[] = [];
      for (let i = 0; i < numReadings; i++) {
        const start = i * 60;
        const measurementHex = packetHex.slice(start, start + 60);
        measurements.push(measurementHex);
      }

      measurements.forEach((measurementHex, index) => {
        const unixTimestamp = parseTimestampHex(measurementHex);
        const batteryVoltage = parseBatteryVoltageHex(measurementHex);
        const temperature = parseTemperatureHex(measurementHex);
        const accel = parseAccelerometerHex(measurementHex);
        const frequencies = parseFrequencyHex(measurementHex);
        const amplitudes = parseAmplitudeHex(measurementHex);

        console.log(`📤 Test ...7777 measurement ${index + 1} values to send:`, {
          deviceId,
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
      });
    } else {
      console.log("📤 Test ...7777 (0 readings): No values to send (all zeros)");
    }

    const mockChar = {
      uuid: logReadCharUuid,
      writeValue: async (data: ArrayBuffer) => {
        console.log("📝 Mock writeValue:", toHexString(new Uint8Array(data)));
      },
      readValue: async () => {
        readCount++;
        if (readCount === 1) {
          console.log(
            "📜 Mock returning acknowledgment:",
            toHexString(ackBuffer)
          );
          return { buffer: ackBuffer.buffer, getUint8: (i: number) => ackBuffer[i] } as DataView;
        }
        console.log(
          `📜 Mock returning packet (${numReadings} readings):`,
          packetHex
        );
        onPacketReceived?.(packetHex); // Call callback with packet hex
        return { buffer: packetData.buffer, getUint8: (i: number) => packetData[i] } as DataView;
      },
    } as BluetoothRemoteGATTCharacteristic;

    // Temporarily override characteristic
    setCharacteristics({
      ...characteristics,
      [logReadCharUuid]: mockChar,
    });
    await getHistoricalLogs(logReadCharUuid);
    // Restore original characteristics
    setCharacteristics(characteristics);
  };

  // Test handler for ...2222 channel (single reading)
  const handleTest2222 = async () => {
    const measurementCharUuid = activeDevice?.measurementCharUuid || mockMeasurementCharUuid;
    const deviceId = activeDevice?.deviceId || mockDeviceId;

    // Create mock characteristic for notifications
    const timestamp = Math.floor(Date.now() / 1000);
    const readingData = generateReading(timestamp);
    const readingHex = toHexString(readingData);

    // Log the reading data and parsed values
    console.log("📡 Test ...2222 reading (hex):", readingHex);
    const unixTimestamp = parseTimestampHex(readingHex);
    const batteryVoltage = parseBatteryVoltageHex(readingHex);
    const temperature = parseTemperatureHex(readingHex);
    const accel = parseAccelerometerHex(readingHex);
    const frequencies = parseFrequencyHex(readingHex);
    const amplitudes = parseAmplitudeHex(readingHex);
    console.log("📤 Test ...2222 values to send:", {
      deviceId,
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

    const mockChar = {
      uuid: measurementCharUuid,
      startNotifications: async () => {
        console.log("📡 Mock starting notifications");
        setTimeout(() => {
          const event = new CustomEvent("characteristicvaluechanged", {
            detail: {
              target: {
                value: {
                  buffer: readingData.buffer,
                  getUint8: (i: number) => readingData[i],
                },
              },
            },
          });
          console.log("📡 Mock sending reading:", readingHex);
          mockChar.dispatchEvent(event);
        }, 1000);
      },
      addEventListener: (type: string, listener: (event: any) => void) => {
        window.addEventListener(type, listener);
      },
      dispatchEvent: (event: Event) => {
        window.dispatchEvent(event);
      },
      removeEventListener: (type: string, listener: (event: any) => void) => {
        window.removeEventListener(type, listener);
      },
    } as BluetoothRemoteGATTCharacteristic;

    // Temporarily override characteristic
    setCharacteristics({
      ...characteristics,
      [measurementCharUuid]: mockChar,
    });
    await startStreaming();
    // Restore original characteristics
    setCharacteristics(characteristics);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[8, 7, 6, 5, 4, 3, 2, 1, 0].map((numReadings) => (
          <Button
            key={`test-7777-${numReadings}`}
            onPress={() => handleTest7777(numReadings)}
            color="warning"
            variant="flat"
          >
            Test ...7777 ({numReadings} {numReadings === 0 ? "Zero" : "Readings"})
          </Button>
        ))}
      </div>
      <Button
        onPress={handleTest2222}
        color="primary"
        variant="flat"
        className="w-full"
      >
        Test ...2222 (Single Reading)
      </Button>
    </div>
  );
};

export default TestButtons;