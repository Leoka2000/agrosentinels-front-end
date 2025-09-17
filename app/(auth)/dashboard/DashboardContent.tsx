"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card as HeroCard } from "@heroui/card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { Kbd } from "@heroui/kbd";
import { Spinner } from "@heroui/spinner"; 
import { Pagination } from "@heroui/pagination"; 
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

import VoltageProvider from "@/components/voltage/VoltageWrapper";
import AccelerometerProvider from "@/components/accelerometer/AccelerometerWrapper";
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
import { Bluetooth, SquarePlus } from "lucide-react";
import { Skeleton } from "@heroui/skeleton";
import { VoltageCard } from "@/components/voltage/VoltageCard";
import { TemperatureCard } from "@/components/temperature/TemperatureCard";
import { TimestampCard } from "@/components/TimestampCard";
import { AlertCard } from "@/components/AlertCard";
import { useAuth } from "@/context/AuthContext";
import VoltageWrapper from "@/components/voltage/VoltageWrapper";
import AccelerometerWrapper from "@/components/accelerometer/AccelerometerWrapper";

// --------------------------- Dashboard Component ---------------------------
const DashboardContent: React.FC = () => {
  // --------------------------- Local state ---------------------------
  const [user, setUser] = useState<any>(null); // user data if needed locally
  const [loadingUser, setLoadingUser] = useState(true); // loading flag for user
  const [error, setError] = useState<string | null>(null); // store errors
  const [newDeviceName, setNewDeviceName] = useState<string>(""); // form state for creating device
  const [deviceName, setDeviceName] = React.useState(""); // currently edited device name

  // --------------------------- Contexts ---------------------------
  const { token } = useAuth(); // authentication token & user context
  const {
    devices,
    page,
    setPage,
    saveDevice,
    isRegistered,
    isCreating,
    isLayoutLoading,
    scanForDevices,
    showRegisterModal,
    setShowRegisterModal,
    registerDevice,
    form,
    isScanning,
    isRegistering,
    showCreateModal,
    setShowCreateModal,
    hasCreatedFirstDevice,
  } = useBluetoothDevice(); // Bluetooth device management

  // currently selected device based on pagination
  const currentDevice = devices[page - 1];

  // --------------------------- case 1: no devices created - usually user that just created an account ---------------------------
  if (!hasCreatedFirstDevice) {
    // make user create their first device
    return (
      <div className="mx-auto w-full">
        <Card className="px-8 py-6 w-full relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col h-full items-center justify-center dark:bg-neutral/900 backdrop-blur-md z-10">
            <div className="shadow-2xl border border-neutral-300 dark:border-neutral-800 rounded-xl p-10 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center">
              <Alert
                color="warning"
                title="No devices found"
                description="Please create and register your first device"
              />
              <Button
                variant="shadow"
                color="success"
                className="w-full mt-8"
                endContent={<SquarePlus size={16} />}
                onClick={() => setShowCreateModal(true)}
              >
                Create device
              </Button>
            </div>
          </div>
          <CardContent style={{ padding: 0 }}>
            <PlaceholderCards /> {/* show skeleton placeholders while no devices exist */}
          </CardContent>
        </Card>

        {/* modal for creating a new device */}
        <Modal isOpen={showCreateModal} onOpenChange={setShowCreateModal}>
          <ModalContent>
            <ModalHeader>Create Device</ModalHeader>
            <ModalBody className="flex flex-col gap-2">
              <Input
                label="Device Name"
                placeholder="Enter device name"
                value={newDeviceName}
                onValueChange={setNewDeviceName}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                variant="bordered"
                onPress={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                color="success"
                isDisabled={!deviceName.trim() || isCreating} // disable if input empty or creating
                isLoading={isCreating} // show spinner if creating
                onPress={() => saveDevice(deviceName.trim())} // save new device to DB
              >
                Create
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    );
  }

  // --------------------------- case 2: layout is loading ---------------------------
  if (isLayoutLoading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="skeleton-dashboard" 
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* skeleton placeholders for header, cards, and charts */}
          <div className="xl:p-14 sm:p-6 p-4">

            <div className="flex justify-center mb-5 flex-col">
              <Skeleton className="h-8 w-1/3 rounded-lg" />
              <Skeleton className="h-4 w-2/3 mt-2 rounded-lg" />
            </div>

  
            <div className="flex justify-baseline gap-1 mb-7 ">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-lg" />
              ))}
            </div>

     
            <div className="grid auto-rows-min lg:grid-cols-3 pb-4 gap-4">
              {[...Array(3)].map((_, i) => (
                <HeroCard
                  key={i}
                  className="w-full relative h-[11.5rem] gap-2 p-6 pt-8"
                >
                  <Skeleton className="h-10 w-3/5 rounded-lg" />
                  <Skeleton className="h-4 w-3/5 rounded-lg" />
                  <Skeleton className="h-4 w-4/5 rounded-lg" />
                  <Skeleton className="h-4 w-2/5 rounded-lg" />
                  <Skeleton className="p-4.5 absolute top-4.5 right-4.5 rounded-lg" />
                </HeroCard>
              ))}
            </div>


            <div className="grid auto-rows-min relative mb-[7.825rem] lg:grid-cols-4 gap-4  ">
              {[...Array(4)].map((_, i) => (
                <HeroCard key={i} className="w-full gap-2 h-[10rem] p-6 pt-4">
                  <Skeleton className="h-10 w-3/5 rounded-lg" />
                  <Skeleton className="h-4 w-3/5 rounded-lg" />
                  <Skeleton className="h-4 w-4/5 rounded-lg" />
                  <Skeleton className="h-4 w-2/5 rounded-lg" />
                  <Skeleton className="p-4.5 absolute top-4.5 right-4.5 rounded-lg" />
                </HeroCard>
              ))}
            </div>


            <div className="grid lg:grid-cols-1">
              <HeroCard className="px-10 py-18 space-y-4">
                <Skeleton className="h-6 w-1/3 rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </HeroCard>
              <HeroCard className="px-10 py-18 space-y-4">
                <Skeleton className="h-12 w-1/3 rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </HeroCard>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // --------------------------- case 3: Rregistered device dashboard - THE ACTUAL DASHBOARD ---------------------------
  return (
    <div className="xl:p-14 sm:p-6 p-4">
      {/* Dashboard header */}
      <div className="flex justify-center mb-5 flex-col">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-md">
          Visualize your device's health and live metrics
        </p>
      </div>

      {/* Selected device info & connect button */}
      <CardContent style={{ padding: "0" }} className="my-5">
        <div className="flex md:flex-row flex-col items-baseline justify-between w-full">
          <div className="flex justify-between items-center space-x-2 mb-2">
            <Kbd className="p-2">
              <Bluetooth size={22} />
            </Kbd>
            <span className="font-medium text-xl">{currentDevice?.name}</span>
          </div>
          <BluetoothConnectButton />
        </div>
      </CardContent>

      {/* Pagination for devices */}
      <div className="flex justify-baseline mb-8">
        <Pagination
          color="success"
          total={devices.length}
          page={page}
          onChange={setPage}
        />
      </div>

      {/* If device is registered, show metrics */}
      {isRegistered ? (
        <div className="mx-auto w-full">
          <AnimatePresence mode="wait">
            {currentDevice && (
              <motion.div
                key={currentDevice?.id} // animate when device changes
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="w-full">
                  <CardContent style={{ padding: "0" }}>
                    {/* Top cards row: Amplitude, Accelerometer, Frequency */}
                    <div className="grid auto-rows-min lg:grid-cols-3 space-x-4 space-y-4 mb-4 sm:mb-0">
                      <div className="h-[11.5rem] sm:w-auto w-full">
                        <AmplitudeCard />
                      </div>
                      <div className="h-[11.5rem] sm:w-auto w-full">
                        <AccelerometerCard />
                      </div>
                      <div className="h-[11.5rem] sm:w-auto w-full">
                        <FrequencyCard />
                      </div>
                    </div>

                    {/* Bottom cards row: Temperature, Voltage, Timestamp, Alert */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 space-x-4 space-y-4">
                      <TemperatureCard />
                      <VoltageCard />
                      <TimestampCard />
                      <AlertCard />
                    </div>
                  </CardContent>

                  {/* Providers and charts */}
                  <CardContent style={{ padding: "0" }} className="py-3 my-5">
                    <VoltageWrapper />
                  </CardContent>
                  <CardContent style={{ padding: "0" }} className="py-3 my-5">
                    <TemperatureWrapper />
                  </CardContent>
                  <CardContent style={{ padding: "0" }} className="py-3 my-5">
                    <AccelerometerWrapper />
                  </CardContent>
                  <CardContent style={{ padding: "0" }} className="py-3 my-5">
                    <FrequencyChart />
                  </CardContent>
                  <CardContent style={{ padding: "0" }} className="py-3 my-5">
                    <AmplitudeChart />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // --------------------------- Case 4: Device not registered ---------------------------
        <div className="mx-auto w-full">
          <Card className="px-8 py-6 w-full relative overflow-hidden">
            {/* Overlay prompting registration */}
            <div className="absolute inset-0 flex flex-col h-full items-center justify-center bg-white/900 dark:bg-neutral/90 backdrop-blur-xs z-10">
              <div className="absolute top-28 shadow-2xl border border-neutral-300 dark:border-neutral-800 rounded-xl p-10 px-8 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center">
                <Alert
                  color="default"
                  title="Your device is not registered."
                  description="Please register it to start monitoring your device"
                />
                <Button
                  variant={"shadow"}
                  color="success"
                  className="w-full mt-8"
                  onClick={scanForDevices}
                  disabled={isScanning} // prevent multiple scans
                >
                  {isScanning ? <Spinner size="sm" /> : "Register"}
                </Button>
              </div>
            </div>

            {/* Dashboard placeholders below overlay */}
            <CardContent style={{ padding: "0" }}>
              {/* Top row */}
              <div className="grid auto-rows-min gap-4 space-x-2 mb-2 lg:grid-cols-3">
                <AmplitudeCard />
                <AccelerometerCard />
                <FrequencyCard />
              </div>
              {/* Bottom row */}
              <div className="grid grid-cols-1 space-x-2 md:grid-cols-2 py-4 lg:grid-cols-4 gap-4">
                <TemperatureCard />
                <VoltageCard />
                <TimestampCard />
                <AlertCard />
              </div>
            </CardContent>

            {/* BLE connect button */}
            <CardContent style={{ padding: "0" }} className="mb-10">
              <div className="flex md:flex-row flex-col items-baseline justify-between w-full">
                <div className="flex justify-between items-center space-x-2 mb-4">
                  <Kbd className="p-2">
                    <Bluetooth size={22} />
                  </Kbd>
                  <span className="font-medium text-xl"></span>
                </div>
                <BluetoothConnectButton />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --------------------------- BLE Registration Modal --------------------------- */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      >
        <ModalContent>
          <ModalHeader>Register Device</ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            {/* Display all BLE characteristics */}
            <Input label="Service UUID" value={form.serviceUuid} readOnly />
            <Input label="Measurement Char UUID" value={form.measurementCharUuid} readOnly />
            <Input label="Log Read Char UUID" value={form.logReadCharUuid} readOnly />
            <Input label="Set Time Char UUID" value={form.setTimeCharUuid} readOnly />
            <Input label="LED Control Char UUID" value={form.ledControlCharUuid} readOnly />
            <Input label="Sleep Control Char UUID" value={form.sleepControlCharUuid} readOnly />
            <Input label="Alarm Char UUID" value={form.alarmCharUuid} readOnly />
          </ModalBody>
          <ModalFooter>
            <Button variant={"flat"} color="default" onClick={() => setShowRegisterModal(false)}>
              Cancel
            </Button>
            <Button color="success" variant={"shadow"} onClick={registerDevice} disabled={isRegistering}>
              {isRegistering ? <Spinner size="sm" /> : "Register"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DashboardContent;
