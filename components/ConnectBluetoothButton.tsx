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
import GetLogsButton from "./GetLogsButton";

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
    startStreaming,
    getHistoricalLogs,
    latestParsedMessage,
  } = useBluetoothSensor();

  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [packetCount, setPacketCount] = useState(0);
  const [isLogCaptureComplete, setIsLogCaptureComplete] = useState(false);
  const [increments, setIncrements] = useState(generateRandomIncrements());
  const [incrementIndex, setIncrementIndex] = useState(0);
  const [latestPacket, setLatestPacket] = useState<string | null>(null);

  // Debug: log the active device
  useEffect(() => {
    console.log("🔹 Active device:", activeDevice);
  }, [activeDevice]);

  // Auto-sequence after connection
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
          console.error("❌ Failed Sleep ON:", err);
        }
      }, 1000);

      const timer2 = setTimeout(async () => {
        try {
          await writeSetTime(activeDevice.setTimeCharUuid);
        } catch (err) {
          console.error("❌ Failed SetTime:", err);
        }
      }, 2000);

    /*  const timer3 = setTimeout(async () => {
        try {
          if (activeDevice.logReadCharUuid) {
            await getHistoricalLogs(
              activeDevice.logReadCharUuid,
              () => {
                console.log("✅ getHistoricalLogs completed");
                setIsLogCaptureComplete(true);
              },
              (hexString) => {
                console.log("📥 Packet received:", hexString);
                setLatestPacket(hexString);
                setPacketCount((prev) => prev + 1);
                setProgress(100);
              }
            );
          }
        } catch (err) {
          console.error("❌ Auto log fetch failed:", err);
        }
      }, 3000); */

   /*   const timer4 = setTimeout(async () => {
        try {
          if (activeDevice.measurementCharUuid) {
            await startStreaming();
          }
        } catch (err) {
          console.error("❌ Auto log fetch failed:", err);
        }
      }, 4000);*/

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        /*   clearTimeout(timer3); */ 
         /*  clearTimeout(timer4);  */ 
      };
    }
  }, [
    localConnected,
    activeDevice,
    writeSleepOn,
    writeSetTime,
    // getHistoricalLogs,
    // startStreaming,
  ]);

  // Progress animation
  useEffect(() => {
    if (!isLogCaptureComplete && localConnected) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return prev;
          const nextIndex = incrementIndex + 1;
          const increment = increments[incrementIndex] || 0;
          setIncrementIndex(nextIndex >= increments.length ? 0 : nextIndex);
          return Math.min(prev + increment, 99.9);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [localConnected, isLogCaptureComplete, incrementIndex, increments]);

  const handleScan = async () => {
    if (!activeDevice || !activeDevice.serviceUuid) {
      addToast({
        title: "Cannot scan – no registered active device",
        color: "warning",
      });
      return;
    }
    setIsScanning(true);
    try {
      await scanForDevices(activeDevice.serviceUuid);
    } catch (err) {
      console.error("❌ Scan failed:", err);
      addToast({ title: "Scan failed", color: "danger" });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col pt-3 gap-3">
      {/* Action Buttons */}
      <div className="flex flex-row flex-wrap w-full items-center pt-3">
        <div className="flex flex-row gap-1.5">
          <Tooltip content="Fetch packets manually">
            <Button
              onPress={() =>
                activeDevice?.logReadCharUuid &&
                getHistoricalLogs(activeDevice.logReadCharUuid)
              }
              color="warning"
              variant="flat"
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
              variant="flat"
              isIconOnly
              isDisabled={!localConnected || !activeDevice?.measurementCharUuid}
            >
              <CirclePlay />
            </Button>
          </Tooltip>
        </div>
<GetLogsButton/>
        {/* Scan / Disconnect */}
        <div className="ml-2">
          {!localConnected ? (
            <Tooltip content="Scan for nearby devices">
              <Button
                onPress={handleScan}
                color="success"
                variant="flat"
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

      {/* Progress + Logs Display */}
      {localConnected && (
        <div className="flex flex-col gap-3">
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
          {isLogCaptureComplete && (
            <Alert
              color="success"
              title="All packets collected successfully!"
            />
          )}
          <p>Packets received: {packetCount}</p>
          {latestParsedMessage && (
            <Card className="p-3">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {latestParsedMessage}
              </pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default BluetoothConnectButton;
