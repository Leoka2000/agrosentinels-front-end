"use client";

import React, { useState, useEffect } from "react";
import { Bluetooth, BluetoothOff, Loader2 } from "lucide-react";
import { Button } from "@heroui/button";
import { useBluetoothSensor } from "../context/useBluetoothSensor";

interface BluetoothConnectButtonProps {
  setTimeCharUuid: string;
  sleepControlCharUuid: string;
}

const BluetoothConnectButton: React.FC<BluetoothConnectButtonProps> = ({
  setTimeCharUuid,
  sleepControlCharUuid,
}) => {
  const {
    activeDevice,
    scanForDevices,
    disconnectBluetooth,
    localConnected,
    writeSetTime,
    writeSleepOn,
    writeSleepOff,
  } = useBluetoothSensor();

  const [isScanning, setIsScanning] = useState(false);

  // Debug: log the active device and characteristic info
  useEffect(() => {
    console.log("🔹 Active device in context:", activeDevice);
  }, [activeDevice]);

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
          isDisabled={isScanning}
          startContent={
            isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bluetooth className="h-4 w-4" />
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

      {localConnected && (
        <div className="flex flex-col gap-2 w-full">
          <Button onPress={() => writeSetTime(setTimeCharUuid)} color="primary">
            Send Current Timestamp
          </Button>
          <Button onPress={() => writeSleepOn(sleepControlCharUuid)} color="secondary">
            Sleep ON
          </Button>
          <Button onPress={() => writeSleepOff(sleepControlCharUuid)} color="secondary">
            Sleep OFF
          </Button>
        </div>
      )}
    </div>
  );
};

export default BluetoothConnectButton;
