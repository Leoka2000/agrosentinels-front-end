"use client";
import React, { useEffect, useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { getToken } from "@/lib/auth";
import { addToast } from "@heroui/toast";
import { motion } from "framer-motion";
import { ArrowBigRight, Bluetooth, Trash } from "lucide-react";
import { Kbd } from "@heroui/kbd";
import VoltageProvider from "./voltage/VoltageProvider";
import AccelerometerProvider from "./accelerometer/AccelerometerProvider";
import BluetoothConnectButton from "./ConnectBluetoothButton";
import { Button } from "@heroui/button";
import DeleteDeviceButton from "./DeleteDeviceBtn";
import { Separator } from "@radix-ui/react-separator";
import { SidebarSeparator } from "./ui/sidebar";

interface Device {
  id: number;
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

interface ActiveDeviceResponse {
  deviceId: number;
  deviceName: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

const DeviceTabs: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const token = getToken();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [animateKey, setAnimateKey] = useState(0);
  const [deviceSelectionTrigger, setDeviceSelectionTrigger] =
    useState<number>(0);

  useEffect(() => {
    if (deviceSelectionTrigger === 0) return;
    setAnimateKey((prev) => prev + 1);
  }, [deviceSelectionTrigger]);


  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/device/list`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data: Device[] = await res.json();
      setDevices(data || []);
    } catch (err) {
      console.error(err);
      addToast({
        title: "Error",
        description: "Failed to load devices",
        color: "danger",
      });
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchActiveDevice = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/device/active`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch active device");
      const data: ActiveDeviceResponse = await res.json();
      setActiveDeviceId(data.deviceId.toString());
    } catch (err) {
      console.error(err);
      setActiveDeviceId("");
    }
  };

  const handleDeviceSelect = async (deviceId: string) => {
    try {
      setIsSelecting(true);
      setActiveDeviceId(deviceId);

      const res = await fetch(
        `${API_BASE_URL}/api/device/select?deviceId=${deviceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to set active device");

      setDeviceSelectionTrigger((prev) => prev + 1);
      await fetchActiveDevice();
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "Error",
        description: err.message || "Failed to select device",
        color: "danger",
      });
    } finally {
      setIsSelecting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchDevices();
      await fetchActiveDevice();
    };
    init();
  }, [deviceSelectionTrigger]);
  return (
    <div className=" mx-auto">
      <Tabs
        aria-label="Device Tabs"
        radius="lg"
    
        selectedKey={activeDeviceId}
        onSelectionChange={(key) => handleDeviceSelect(key as string)}
        color="default"
        className=" max-w-[600px]"
        classNames={{
          tabList: "flex-owrap inline-flex scrollbar-hide p-4",
          tab: "whitespace-nowrap",
        }}
      >
        {devices.map((device) => (
          <Tab
            key={device.id.toString()}
            className=""
            title={
              <div>
                <div className="flex items-center  space-x-2">
                  <Kbd>
                    <Bluetooth size={15} />
                  </Kbd>
                  <span>{device.name}</span>
                </div>
              </div>
            }
            isDisabled={isSelecting}
          >
            <Card className="px-8 py-6 w-full">
              <CardBody>
                <div className="flex md:flex-row flex-col items-center justify-between w-full">
                  <DeleteDeviceButton />
                  <BluetoothConnectButton />
                </div>
              </CardBody>
              <CardBody>
                <VoltageProvider />
              </CardBody>
              <CardBody>
                <AccelerometerProvider />
              </CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};

export default DeviceTabs;
