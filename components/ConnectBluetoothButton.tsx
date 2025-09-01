"use client";

import React, { useState, useEffect } from "react";
import { Bluetooth, BluetoothOff, Loader2 } from "lucide-react";
import { Button } from "@heroui/button";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Spinner } from "@heroui/spinner";
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

  // debug: log the active device and characteristic info
  useEffect(() => {
    console.log("🔹 Active device in context:", activeDevice);
  }, [activeDevice]);

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
  }, [localConnected, activeDevice, writeSleepOn, writeSetTime]);

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
            onPress={() => startStreaming(activeDevice.measurementCharUuid)}
            color="success"
            isDisabled={!activeDevice.measurementCharUuid}
          >
            Start Streaming
          </Button>
           <Button
      onPress={() => getHistoricalLogs(activeDevice.logReadCharUuid)}
      color="warning"
    >
      Start Capturing Logs
    </Button>
        </div>
      )}
    </div>
  );
};

export default BluetoothConnectButton;
