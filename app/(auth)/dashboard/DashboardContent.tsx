"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { Kbd } from "@heroui/kbd";
import { Spinner } from "@heroui/spinner"; // Assuming you have a spinner component
import { Pagination } from "@heroui/pagination"; // Replace with your shadcn pagination or custom
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import VoltageProvider from "@/components/voltage/VoltageProvider";
import AccelerometerProvider from "@/components/accelerometer/AccelerometerProvider";
import BluetoothConnectButton from "@/components/ConnectBluetoothButton";
import TemperatureWrapper from "@/components/temperature/TemperatureWrapper";
import { AmplitudeCard } from "@/components/amplitude/AmplitudeCard";
import { FrequencyCard } from "@/components/frequency/FrequencyCard";
import { AccelerometerCard } from "@/components/accelerometer/AccelerometerCard";
import { BottomCards } from "@/components/BottomCards";
import { FrequencyChart } from "@/components/frequency/FrequencyChart";
import { AmplitudeChart } from "@/components/amplitude/AmplitudeChart";
import { PlaceholderCards } from "@/components/PlaceholderCards";
import { PlaceholderChart } from "@/components/PlaceholderChart";

import { useBluetoothDevice } from "@/context/BluetoothDeviceContext";
import { Bluetooth } from "lucide-react";

const DashboardContent: React.FC = () => {
  const {
    devices,
    page,
    setPage,
    isRegistered,
    isLayoutLoading,
    scanForDevices,
    showRegisterModal,
    setShowRegisterModal,
    registerDevice,
    form,
    isScanning,
    isRegistering,
  } = useBluetoothDevice();

  const currentDevice = devices[page - 1];

  if (isLayoutLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="gap-4 xl:px-24 sm:p-10 px-4  py-2">
      {/* Header */}
      <div className="flex justify-center  mb-5 flex-col">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-md">
          Visualize your device's health and live metrics
        </p>
      </div>

      {/* Pagination */}
      <div className="flex justify-baseline  my-10">
        <Pagination color="success" total={devices.length} page={page} onRateChange={setPage} />
      </div>

      {/* Registered Device Dashboard */}
      {isRegistered ? (
        <div className="mx-auto w-full">
          {currentDevice && (
            <Card  className=" w-full">
              <CardContent style={{padding:'0'}}>
                <div className="grid auto-rows-min gap-4 lg:grid-cols-3">
                  <div className="h-[11.5rem]">
                    <AmplitudeCard />
                  </div>
                  <div className="h-[11.5rem] rounded-xl">
                    <AccelerometerCard />
                  </div>
                  <div className="h-[11.5rem] rounded-xl">
                    <FrequencyCard />
                  </div>
                </div>

                <BottomCards />
              </CardContent>
              <CardContent style={{padding:'0'}} className="mb-10">
                <div className="flex md:flex-row flex-col mb-3 md:mt-10 mt-5 items-baseline justify-between w-full">
                  <div className="flex justify-between items-center space-x-2 mb-4">
                    <Kbd className="p-2">
                      <Bluetooth size={22} />
                    </Kbd>
                    <span className="font-medium text-xl">
                      {currentDevice.name}
                    </span>
                  </div>
                  <BluetoothConnectButton />
                </div>
              </CardContent>

              <CardContent style={{padding:'0'}} className="py-3 my-5">
                <VoltageProvider />
              </CardContent>
              <CardContent style={{padding:'0'}} className="py-3 my-5">
                <TemperatureWrapper />
              </CardContent>
              <CardContent style={{padding:'0'}} className="py-3 my-5">
                <AccelerometerProvider />
              </CardContent >
              <CardContent style={{padding:'0'}} className="py-3 my-5">
                <FrequencyChart />
              </CardContent>
              <CardContent style={{padding:'0'}} className="py-3 my-5">
                <AmplitudeChart />
              </CardContent>
            </Card>
          )}

      
        </div>
      ) : (
        // Not registered
        <div className="mx-auto w-full">
          <Card className="px-8 py-6 w-full relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
              <div className="absolute top-32 shadow-2xl border border-neutral-300 dark:border-neutral-800 rounded-xl p-10 px-8 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center">
                <Alert
                  variant="destructive"
                  title="Your device is not registered."
                  description="Please register it to start monitoring your device"
                  action={
                    <Button
                      variant="outline"
                      className="ml-12"
                      onClick={scanForDevices}
                      disabled={isScanning}
                    >
                      {isScanning ? <Spinner size="sm" /> : "Register"}
                    </Button>
                  }
                />
              </div>
            </div>

            <CardContent className="flex grid-cols-4">
              <PlaceholderCards />
            </CardContent>
            <CardContent>
              <PlaceholderChart />
            </CardContent>
          </Card>
        </div>
      )}

      {/* BLE Registration Modal */}
      <Modal open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <ModalContent>
          <ModalHeader>Register Device</ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            <Input label="Service UUID" value={form.serviceUuid} readOnly />
            <Input
              label="Measurement Char UUID"
              value={form.measurementCharUuid}
              readOnly
            />
            <Input
              label="Log Read Char UUID"
              value={form.logReadCharUuid}
              readOnly
            />
            <Input
              label="Set Time Char UUID"
              value={form.setTimeCharUuid}
              readOnly
            />
            <Input
              label="LED Control Char UUID"
              value={form.ledControlCharUuid}
              readOnly
            />
            <Input
              label="Sleep Control Char UUID"
              value={form.sleepControlCharUuid}
              readOnly
            />
            <Input
              label="Alarm Char UUID"
              value={form.alarmCharUuid}
              readOnly
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegisterModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={registerDevice}
              disabled={isRegistering}
            >
              {isRegistering ? <Spinner size="sm" /> : "Register"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DashboardContent;
