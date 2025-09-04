"use client";

import React, { useState, useEffect } from "react";
import { Bluetooth, BluetoothOff } from "lucide-react";
import { addToast } from "@heroui/toast";
import { Button} from "@heroui/button"
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/modal";
import { Progress } from "@heroui/progress";
import { Alert } from "@heroui/alert";
import TestButtons from "./TestButtons";

// Generate random increments summing to 100 for 60 steps
const generateRandomIncrements = (steps: number = 60): number[] => {
  const increments = Array.from({ length: steps }, () => Math.random() * 9.5 + 0.5); // Random 0.5–10
  const sum = increments.reduce((acc, val) => acc + val, 0);
  return increments.map((inc) => (inc / sum) * 100); // Normalize to sum to 100
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
                  </>
                ) : (
                  <>
                    <p>Waiting for packet {packetCount + 1}...</p>
                    <Progress
                      aria-label="Fetching packet..."
                      className="max-w-md"
                      color="success"
                      showValueLabel={true}
                      size="md"
                      value={progress}
                    />
                    <TestButtons onPacketReceived={(packetHex: string) => {
                      setProgress(100);
                      addToast({
                        title: "Packet arrived successfully",
                        timeout: 3000,
                        shouldShowTimeoutProgress: true,
                      });
                      setPacketCount((prev) => prev + 1);
                      if (packetHex === "0".repeat(480)) {
                        setIsZeroPacketReceived(true);
                      }
                      setTimeout(resetProgressCycle, 100);
                    }} />
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