"use client";

import React, { useState, useEffect } from "react";
import {
  Bluetooth,
  BluetoothOff,
  CircleOff,
  CirclePlay,
  ClipboardClock,
} from "lucide-react";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
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
import { Card } from "@heroui/card";

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
    latestParsedMessage,
  } = useBluetoothSensor();

  const [isScanning, setIsScanning] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [progress, setProgress] = useState(0);
  const [packetCount, setPacketCount] = useState(0);
  const [isLogCaptureComplete, setIsLogCaptureComplete] = useState(false);
  const [increments, setIncrements] = useState(generateRandomIncrements());
  const [incrementIndex, setIncrementIndex] = useState(0);
  const [latestPacket, setLatestPacket] = useState<string | null>(null);

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
    setLatestPacket(null);
    setIncrementIndex(0);
    setIncrements(generateRandomIncrements());
    onClose();
  };

  // Fetch packets every 60 seconds
  useEffect(() => {
    if (isOpen && !isLogCaptureComplete && activeDevice?.logReadCharUuid) {
      const fetchPacket = async () => {
        try {
          await getHistoricalLogs(
            activeDevice.logReadCharUuid,
            () => {
              console.log("✅ Auto getHistoricalLogs completed");
              setIsLogCaptureComplete(true);
            },
            (hexString) => {
              console.log(
                "📥 Packet received in BluetoothConnectButton:",
                hexString
              );
              setLatestPacket(hexString);
            }
          );
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
    if (!activeDevice || !activeDevice.serviceUuid) {
      console.error("❌ Cannot scan: serviceUuid is undefined on activeDevice");
      addToast({
        title: "Cannot scan – no registered active device",
        color: "warning",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }

    setIsScanning(true);
    try {
      await scanForDevices(activeDevice.serviceUuid);
    } catch (err) {
      console.error("❌ Scan failed:", err);
      addToast({
        title: "Scan failed",
        color: "danger",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col pt-3 gap-3">
      <div className="flex flex-row flex-wrap w-full items-center pt-3">
        {/* Left group: all action buttons */}
        <div className="flex flex-row gap-1.5">
          <Tooltip content="Fetch packets from device">
            <Button
              onPress={onOpen}
              color="warning"
              variant="faded"
              isIconOnly
              isDisabled={!localConnected}
            >
              <ClipboardClock size={18} />
            </Button>
          </Tooltip>

          <Tooltip content="Start streaming data">
            <Button
              onPress={() => startStreaming()}
              color="success"
              variant="faded"
              isIconOnly
              isDisabled={!localConnected || !activeDevice?.measurementCharUuid}
            >
              <CirclePlay />
            </Button>
          </Tooltip>
        </div>

        {/* Scan / Disconnect button always on the far right */}
        <div className="ml-2">
          {!localConnected ? (
            <Tooltip content="Scan for nearby devices">
              <Button
                onPress={handleScan}
                color="success"
                variant="shadow"
                isDisabled={isScanning}
                startContent={
                  isScanning ? (
                    <Spinner size="sm" />
                  ) : (
                    <Bluetooth className="h-4 w-4" />
                  )
                }
              >
                {isScanning ? "Scanning..." : "Scan"}
              </Button>
            </Tooltip>
          ) : (
            <Tooltip content="Disconnect from device">
              <Button
                onPress={disconnectBluetooth}
                color="danger"
                variant="shadow"
                startContent={<BluetoothOff className="h-4 w-4" />}
              >
                Disconnect
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
      <Modal
        backdrop="blur"
        className="pb-2"
        isOpen={isOpen}
        isDismissable={false} // can't dismiss via clicking backdrop
        isKeyboardDismissDisabled={true} // can't dismiss via escape key
        onClose={() => {}} // onClose does nothing so close button is disabled
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-3">
                <span>Fetching Packets</span>
                {!isLogCaptureComplete && (
                  <Progress
                    aria-label="Fetching packet..."
                    className="w-full"
                    color="success"
                    showValueLabel={true}
                    size="md"
                    value={progress}
                  />
                )}
              </ModalHeader>
              <ModalBody>
                {isLogCaptureComplete ? (
                  <Alert
                    color="success"
                    title="All packets collected successfully!"
                  />
                ) : (
                  <>
                    <p>Waiting for packet {packetCount + 1}...</p>
                    {latestParsedMessage && (
                      <Card className="p-3">
                        <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                          Packet {packetCount + 1} Data:
                          {"\n\n"}
                          {latestParsedMessage}
                        </pre>
                      </Card>
                    )}
                  </>
                )}
              </ModalBody>
              {/* Only render Close button if log capture is complete */}
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
