"use client";

import React, { useState, useEffect } from "react";
import { Bluetooth, BluetoothOff } from "lucide-react";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/modal";
import { Progress } from "@heroui/progress";
import { Alert } from "@heroui/alert";
import TestButtons from "./TestButtons";
import {
  parseTimestampHex,
  parseBatteryVoltageHex,
  parseTemperatureHex,
  parseAccelerometerHex,
  parseFrequencyHex,
  parseAmplitudeHex,
} from "../lib/utils";

// Generate random increments summing to 100 for 60 steps
const generateRandomIncrements = (steps: number = 60): number[] => {
  const increments = Array.from({ length: steps }, () => Math.random() * 9.5 + 0.5); // Random 0.5–10
  const sum = increments.reduce((acc, val) => acc + val, 0);
  return increments.map((inc) => (inc / sum) * 100); // Normalize to sum to 100
};

// Parse packetHex to get reading count and measurement values
const parsePacket = (packetHex: string, deviceId: number) => {
  if (packetHex === "0".repeat(480)) return { readingCount: 0, measurements: [] };
  const measurements = [];
  for (let i = 0; i < 8; i++) {
    const start = i * 60;
    const segment = packetHex.slice(start, start + 60);
    if (segment === "0".repeat(60)) continue;
    const unixTimestamp = parseTimestampHex(segment);
    const batteryVoltage = parseBatteryVoltageHex(segment);
    const temperature = parseTemperatureHex(segment);
    const accel = parseAccelerometerHex(segment);
    const frequencies = parseFrequencyHex(segment);
    const amplitudes = parseAmplitudeHex(segment);
    measurements.push({
      deviceId,
      timestamp: unixTimestamp,
      voltage: !isNaN(batteryVoltage) ? batteryVoltage : "invalid",
      temperature: !isNaN(temperature) ? temperature : "invalid",
      accelerometer:
        !isNaN(accel.x) && !isNaN(accel.y) && !isNaN(accel.z) ? accel : "invalid",
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
  }
  return { readingCount: measurements.length, measurements };
};

const BluetoothConnectButton: React.FC = () => {
  const {
    activeDevice,
    scanForDevices,
    disconnectBluetooth,
    localConnected,
    writeSetTime,
    writeSleepOn,
    writeSleepOff,
    startStreaming,
    getHistoricalLogs,
  } = useBluetoothSensor();

  const [isScanning, setIsScanning] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [progress, setProgress] = useState(0);
  const [packetCount, setPacketCount] = useState(0);
  const [isZeroPacketReceived, setIsZeroPacketReceived] = useState(false);
  const [increments, setIncrements] = useState(generateRandomIncrements());
  const [incrementIndex, setIncrementIndex] = useState(0);
  const [readings, setReadings] = useState<{
    readingCount: number;
    measurements: Array<{
      deviceId: number;
      timestamp: number;
      voltage: number | string;
      temperature: number | string;
      accelerometer: { x: number; y: number; z: number } | string;
      frequencies: { freq1: number; freq2: number; freq3: number; freq4: number } | string;
      amplitudes: { ampl1: number; ampl2: number; ampl3: number; ampl4: number } | string;
    }>;
  }>({ readingCount: 0, measurements: [] });

  // Debug: log the active device
  useEffect(() => {
    console.log("🔹 Active device in context:", activeDevice);
  }, [activeDevice]);

  // Auto-send Sleep ON after connection
  useEffect(() => {
    if (
      localConnected &&
      activeDevice?.sleepControlCharUuid &&
      activeDevice?.setTimeCharUuid
    ) {
      const timer1 = setTimeout(async () => {
        try {
          await writeSleepOn(activeDevice.sleepControlCharUuid);
        } catch (err) {
          console.error("❌ Failed to send Sleep ON:", err);
        }
      }, 1000);

      return () => clearTimeout(timer1);
    }
  }, [localConnected, activeDevice, writeSleepOn]);

  // Progress bar random increase (reach 100% in 60 seconds)
  useEffect(() => {
    if (isOpen && !isZeroPacketReceived) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return prev; // Stay at 100 until packet arrives
          const nextIndex = incrementIndex + 1;
          const increment = increments[incrementIndex] || 0;
          setIncrementIndex(nextIndex >= increments.length ? 0 : nextIndex);
          return Math.min(prev + increment, 99.9); // Cap below 100
        });
      }, 1000); // Update every 1 second

      return () => clearInterval(interval);
    }
  }, [isOpen, isZeroPacketReceived, incrementIndex, increments]);

  // Reset increments on packet arrival or cycle completion
  const resetProgressCycle = () => {
    setProgress(0);
    setIncrementIndex(0);
    setIncrements(generateRandomIncrements());
  };

  // Fetch packets every 60 seconds
  useEffect(() => {
    if (isOpen && !isZeroPacketReceived && activeDevice?.logReadCharUuid) {
      const fetchPacket = async () => {
        try {
          const packetHex = await getHistoricalLogs(activeDevice.logReadCharUuid);
          setProgress(100); // Jump to 100% on packet arrival
          addToast({
            title: "Packet arrived successfully",
            timeout: 3000,
            shouldShowTimeoutProgress: true,
          });
          setPacketCount((prev) => prev + 1);
          const deviceId = activeDevice?.deviceId || 1;
          setReadings(parsePacket(packetHex, deviceId));
          if (packetHex === "0".repeat(480)) {
            setIsZeroPacketReceived(true);
          }
          setTimeout(resetProgressCycle, 100); // Reset progress after brief delay
        } catch (err) {
          console.error("❌ Failed to fetch packet:", err);
        }
      };

      fetchPacket(); // Initial fetch
      const interval = setInterval(fetchPacket, 60000); // Every 60 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, isZeroPacketReceived, activeDevice, getHistoricalLogs]);

  const handleScan = async () => {
    if (!activeDevice?.serviceUuid) {
      console.error("❌ Cannot scan: serviceUuid is undefined on activeDevice");
      return;
    }

    setIsScanning(true);
    await scanForDevices(activeDevice.serviceUuid);
    setIsScanning(false);
  };

  return (
    <div className="flex flex-col pt-3 w-full items-end gap-3">
      <Button
        className="w-full"
        onPress={onOpen}
        color="primary"
        variant="solid"
      >
        Fetch Packets
      </Button>

      {!localConnected ? (
        <Button
          className="md:w-58 w-full"
          onPress={handleScan}
          color="success"
          variant="shadow"
          isDisabled={isScanning || !activeDevice?.serviceUuid}
          startContent={
            isScanning ? (
              <Spinner size="sm" />
            ) : (
              <Bluetooth className="h-4 w-4" />
            )
          }
        >
          {isScanning ? "Scanning..." : "Scan for Devices"}
        </Button>
      ) : (
        <Button
          onPress={disconnectBluetooth}
          color="danger"
          className="md:w-58 w-full"
          startContent={<BluetoothOff className="h-4 w-4" />}
        >
          Disconnect
        </Button>
      )}

      {localConnected && activeDevice && (
        <div className="flex flex-col gap-2 w-full">
          <Button
            onPress={() => writeSetTime(activeDevice.setTimeCharUuid)}
            color="primary"
            isDisabled={!activeDevice.setTimeCharUuid}
          >
            Send Current Timestamp
          </Button>

          <Button
            onPress={() => writeSleepOff(activeDevice.sleepControlCharUuid)}
            color="secondary"
            isDisabled={!activeDevice.sleepControlCharUuid}
          >
            Sleep OFF
          </Button>

          <Button
            onPress={() => startStreaming()}
            color="success"
            isDisabled={!activeDevice.measurementCharUuid}
          >
            Start Streaming
          </Button>

          <Button
            onPress={() => getHistoricalLogs(activeDevice.logReadCharUuid)}
            color="warning"
            isDisabled={!activeDevice.logReadCharUuid}
          >
            Start Capturing Logs
          </Button>
        </div>
      )}

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        isDismissable={isZeroPacketReceived}
        isKeyboardDismissDisabled={!isZeroPacketReceived}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Fetching Packets
              </ModalHeader>
              <ModalBody>
                {isZeroPacketReceived ? (
                  <>
                    <p>All packets collected successfully!</p>
                    <Alert color="success" title="Success" />
                    <Button
                      onPress={onClose}
                      color="primary"
                      variant="solid"
                      className="mt-2"
                    >
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <p>Waiting for packet {packetCount + 1}...</p>
                    <p>Readings in last packet: {readings.readingCount}</p>
                    {readings.measurements.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Measurement Values:</p>
                        <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-60">
                          {readings.measurements.map((m, index) => (
                            <div key={index}>
                              Measurement {index + 1}:
                              <br />
                              deviceId: {m.deviceId}
                              <br />
                              timestamp: {m.timestamp}
                              <br />
                              voltage: {m.voltage}
                              <br />
                              temperature: {m.temperature}
                              <br />
                              accelerometer: {typeof m.accelerometer === "string"
                                ? m.accelerometer
                                : `x: ${m.accelerometer.x}, y: ${m.accelerometer.y}, z: ${m.accelerometer.z}`}
                              <br />
                              frequencies: {typeof m.frequencies === "string"
                                ? m.frequencies
                                : `freq1: ${m.frequencies.freq1}, freq2: ${m.frequencies.freq2}, freq3: ${m.frequencies.freq3}, freq4: ${m.frequencies.freq4}`}
                              <br />
                              amplitudes: {typeof m.amplitudes === "string"
                                ? m.amplitudes
                                : `ampl1: ${m.amplitudes.ampl1}, ampl2: ${m.amplitudes.ampl2}, ampl3: ${m.amplitudes.ampl3}, ampl4: ${m.amplitudes.ampl4}`}
                              <br />
                            </div>
                          ))}
                        </pre>
                      </div>
                    )}
                    <Progress
                      aria-label="Fetching packet..."
                      className="max-w-md mt-2"
                      color="success"
                      showValueLabel={true}
                      size="md"
                      value={progress}
                    />
                    <TestButtons
                      onPacketReceived={(packetHex: string) => {
                        setProgress(100);
                        addToast({
                          title: "Packet arrived successfully",
                          timeout: 3000,
                          shouldShowTimeoutProgress: true,
                        });
                        setPacketCount((prev) => prev + 1);
                        const deviceId = activeDevice?.deviceId || 1;
                        setReadings(parsePacket(packetHex, deviceId));
                        if (packetHex === "0".repeat(480)) {
                          setIsZeroPacketReceived(true);
                        }
                        setTimeout(resetProgressCycle, 100);
                      }}
                    />
                  </>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default BluetoothConnectButton;