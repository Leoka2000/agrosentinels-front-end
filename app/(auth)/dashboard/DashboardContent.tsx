"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Bluetooth } from "lucide-react";
import { addToast } from "@heroui/toast";

import VoltageProvider from "@/components/voltage/VoltageProvider";
import AccelerometerProvider from "@/components/accelerometer/AccelerometerProvider";
import BluetoothConnectButton from "@/components/ConnectBluetoothButton";
import DeleteDeviceButton from "@/components/DeleteDeviceBtn";
import { PlaceholderCards } from "@/components/PlaceholderCards";
import { PlaceholderChart } from "@/components/PlaceholderChart";
import { getToken } from "@/lib/auth";

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

const DashboardContent: React.FC = () => {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [deviceSelectionTrigger, setDeviceSelectionTrigger] =
    useState<number>(0);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token = getToken();

  // Fetch if user has a registered device
  useEffect(() => {
    const fetchActiveDevice = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/device/active`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch active device");

        const data: ActiveDeviceResponse & { registeredDevice?: boolean } =
          await res.json();

        setIsRegistered(data.registeredDevice ?? true);
        setActiveDeviceId(data.deviceId?.toString() || "");
      } catch (error) {
        console.error(error);
        setIsRegistered(false);
      }
    };

    fetchActiveDevice();
  }, [API_BASE_URL, token]);

  // Fetch devices list
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

  // Handle switching active device
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

  // Initial load devices + refresh on device change
  useEffect(() => {
    if (isRegistered) {
      fetchDevices();
    }
  }, [isRegistered, deviceSelectionTrigger]);

  return (
    <div className="gap-4 px-6 py-2">
      <header className="flex items-start justify-between gap-2"></header>

      <div className="flex justify-center pl-1 mb-5 flex-col">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-md">
          Visualize your device's health and live metrics
        </p>
      </div>

      
      {isRegistered === null ? (
        <p>Loading device status...</p>
      ) : isRegistered ? (
        <div className="mx-auto">
          <Tabs
            aria-label="Device Tabs"
            radius="lg"
            selectedKey={activeDeviceId}
            onSelectionChange={(key) => handleDeviceSelect(key as string)}
            color="default"
            className="max-w-[600px]"
            classNames={{
              tabList: "flex-nowrap inline-flex scrollbar-hide p-4",
              tab: "whitespace-nowrap",
            }}
            
          >
            
            {devices.map((device) => (
              <Tab
                key={device.id.toString()}
                title={
                  <div className="flex items-center space-x-2">
                    <Kbd>
                      <Bluetooth size={15} />
                    </Kbd>
                    <span>{device.name}</span>
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
      ) : (
        <Card className="px-8 py-6 w-full relative overflow-hidden">
          {/* Overlay for unregistered device */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/900 backdrop-blur-sm z-10">
            <div className="absolute top-32 shadow-2xl border border-neutral-300 dark:border-neutral-800 rounded-xl p-10 px-8 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center">
              <Alert
                color="warning"
                title="Your device is not registered."
                description="Please register it to start monitoring your device"
                endContent={
                  <Button
                    color="warning"
                    size="sm"
                    variant="flat"
                    className="ml-12"
                  >
                    Register
                  </Button>
                }
              />
            </div>
          </div>

          <CardBody className="flex grid-cols-4">
            <PlaceholderCards />
          </CardBody>
          <CardBody>
            <PlaceholderChart />
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default DashboardContent;
