"use client";

import React, { useState, useEffect } from "react";
import { Bluetooth, BluetoothOff } from "lucide-react";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Progress } from "@heroui/progress";
import { Alert } from "@heroui/alert";

// Generate random increments summing to 100 for 60 steps
const generateRandomIncrements = (steps: number = 60): number[] => {
  const increments = Array.from(
    { length: steps },
    () => Math.random() * 9.5 + 0.5
  ); // Random 0.5–10
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
    setLogCaptureComplete,
  } = useBluetoothSensor();

  const [isScanning, setIsScanning] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [progress, setProgress] = useState(0);
  const [packetCount, setPacketCount] = useState(0);
  const [isLogCaptureComplete, setIsLogCaptureComplete] = useState(false);
  const [increments, setIncrements] = useState(generateRandomIncrements());
  const [incrementIndex, setIncrementIndex] = useState(0);

  // Debug: log the active device
  useEffect(() => {
    console.log("🔹 Active device in context:", activeDevice);
  }, [activeDevice]);

  // Debug: log isLogCaptureComplete changes
  useEffect(() => {
    console.log("🔄 isLogCaptureComplete changed:", isLogCaptureComplete);
  }, [isLogCaptureComplete]);

  // Auto-send Sleep ON and timestamp after connection
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
          addToast({
            title: "Failed to send Sleep ON",
            color: "danger",
            timeout: 3000,
            shouldShowTimeoutProgress: true,
          });
        }
      }, 1000);

      const timer2 = setTimeout(async () => {
        try {
          await writeSetTime(activeDevice.setTimeCharUuid);
        } catch (err) {
          console.error("❌ Failed to send timestamp after connection:", err);
          addToast({
            title: "Failed to send timestamp after connection",
            color: "danger",
            timeout: 3000,
            shouldShowTimeoutProgress: true,
          });
        }
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [localConnected, activeDevice, writeSleepOn, writeSetTime]);

  // Progress bar random increase (reach 100% in 60 seconds)
  useEffect(() => {
    if (isOpen && !isLogCaptureComplete) {
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
  }, [isOpen, isLogCaptureComplete, incrementIndex, increments]);

  // Reset increments on packet arrival or cycle completion
  const resetProgressCycle = () => {
    setProgress(0);
    setIncrementIndex(0);
    setIncrements(generateRandomIncrements());
  };

  // Reset modal state when closing
  const handleClose = () => {
    setProgress(0);
    setPacketCount(0);
    setIsLogCaptureComplete(false);
    setLogCaptureComplete(false); // Reset in context
    setIncrementIndex(0);
    setIncrements(generateRandomIncrements());
    onClose();
  };

  // Fetch packets every 60 seconds
  useEffect(() => {
    if (isOpen && !isLogCaptureComplete && activeDevice?.logReadCharUuid) {
      const fetchPacket = async () => {
        try {
          await getHistoricalLogs(activeDevice.logReadCharUuid, () => {
            console.log("✅ Auto getHistoricalLogs completed");
            setIsLogCaptureComplete(true);
          });
          setProgress(100); // Jump to 100% on packet fetch
          setPacketCount((prev) => prev + 1);
          setTimeout(resetProgressCycle, 100);
        } catch (err) {
          console.error("❌ Failed to fetch packet:", err);
          addToast({
            title: "Failed to fetch packet",
            color: "danger",
          });
        }
      };

      const interval = setInterval(fetchPacket, 60000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isLogCaptureComplete, activeDevice, getHistoricalLogs]);

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
        isDisabled={!localConnected} // Enable only when connected
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
            onPress={() =>
              getHistoricalLogs(activeDevice.logReadCharUuid, () => {
                console.log(
                  "✅ Manual getHistoricalLogs completed, setting isLogCaptureComplete"
                );
                setIsLogCaptureComplete(true);
              })
            }
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
        isDismissable={isLogCaptureComplete}
        isKeyboardDismissDisabled={!isLogCaptureComplete}
        onClose={handleClose}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Fetching Packets
              </ModalHeader>
              <ModalBody>
                {isLogCaptureComplete ? (
                  <>
                    <Alert
                      color="success"
                      title="All packets collected successfully!"
                    />
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
                  </>
                )}
              </ModalBody>
              {isLogCaptureComplete && (
                <ModalFooter>
                  <Button
                    color="primary"
                    onPress={handleClose}
                    className="w-full"
                  >
                    Close
                  </Button>
                </ModalFooter>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default BluetoothConnectButton;
