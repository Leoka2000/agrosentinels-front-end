"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Card as HeroCard } from "@heroui/card";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { Kbd } from "@heroui/kbd";
import { Spinner } from "@heroui/spinner";
import { Pagination } from "@heroui/pagination";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Skeleton } from "@heroui/skeleton";
import { Bluetooth, SquarePlus } from "lucide-react";

import VoltageWrapper from "@/components/voltage/VoltageWrapper";
import AccelerometerWrapper from "@/components/accelerometer/AccelerometerWrapper";
import TemperatureWrapper from "@/components/temperature/TemperatureWrapper";
import { AmplitudeCard } from "@/components/amplitude/AmplitudeCard";
import { FrequencyCard } from "@/components/frequency/FrequencyCard";
import { AccelerometerCard } from "@/components/accelerometer/AccelerometerCard";
import { FrequencyChart } from "@/components/frequency/FrequencyChart";
import { AmplitudeChart } from "@/components/amplitude/AmplitudeChart";
import { PlaceholderCards } from "@/components/PlaceholderCards";
import BluetoothConnectButton from "@/components/ConnectBluetoothButton";
import { VoltageCard } from "@/components/voltage/VoltageCard";
import { TemperatureCard } from "@/components/temperature/TemperatureCard";
import { TimestampCard } from "@/components/TimestampCard";
import { AlertCard } from "@/components/AlertCard";

import { useBluetoothDevice } from "@/context/BluetoothDeviceContext";
import { useAuth } from "@/context/AuthContext";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";
import BackgroundShades from "./BackgroundShades";
import GetLogsButton from "@/components/GetLogsButton";

const DashboardContent: React.FC = () => {
  // --------------------------- Local state ---------------------------
  const [newDeviceName, setNewDeviceName] = useState<string>("");
  const [deviceName, setDeviceName] = useState<string>("");

  // --------------------------- Contexts ---------------------------
  const { token } = useAuth();
  const {
    devices,
    page,
    setPage,
    saveDevice,

    isCreating,
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
  } = useBluetoothDevice();

  const { loading, initialized, isDeviceRegistered } = useGlobalLoading();
  const isReady =
    initialized &&
    isDeviceRegistered !== null &&
    hasCreatedFirstDevice !== null;

  const currentDevice = devices[page - 1];

  // --------------------------- CASE 1: GLOBAL LOADING ---------------------------
  if (!isReady || loading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="skeleton-dashboard"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
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
            <div className="grid auto-rows-min relative mb-[7.825rem] lg:grid-cols-4 gap-4">
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

  // --------------------------- CASE 2: NO DEVICES CREATED ---------------------------
  if (!hasCreatedFirstDevice) {
    return (
      <div className="mx-auto h-full  w-full">
        <Card className="px-8 py-6 w-full relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col h-full items-center justify-center dark:bg-neutral/900 backdrop-blur-md z-10">
            <div className="shadow-2xl border border-neutral-300 flex flex-col items-center">
              <Alert
                color="warning"
                title="No devices found"
                description="Please create and register your first device"
              />
              <Button
                variant="flat"
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
            <PlaceholderCards />
          </CardContent>
        </Card>

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
                isDisabled={!deviceName.trim() || isCreating}
                isLoading={isCreating}
                onPress={() => saveDevice(deviceName.trim())}
              >
                Create
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    );
  }

  // --------------------------- CASE 3: REGISTERED DEVICE DASHBOARD ---------------------------
  return (
    <div className="md:p-10 2xl:px-24  h-full sm:p-6 p-4 overflow-x-clip relative isolate px-3 antialiased  ">
      <BackgroundShades />
      <div className="flex justify-center mb-5 flex-col">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-md">
          Visualize your device's health and live metrics
        </p>
      </div>

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

      <div className="flex justify-baseline mb-8">
        <Pagination 
          color="success"
          total={devices.length}
          className="cursor-pointer"
          page={page}
          onChange={setPage}
        />
      </div>

      {isDeviceRegistered ? (
        <div className="mx-auto w-full">
          <AnimatePresence mode="wait">
            {currentDevice && (
              <motion.div
                key={currentDevice?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="w-full">
                  <CardContent style={{ padding: "0" }}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 space-x-4 space-y-4">
                      <TemperatureCard />
                      <VoltageCard />
                      <TimestampCard />
                      <AlertCard />
                    </div>
                  </CardContent>

                  {/* <CardContent style={{ padding: "0" }} className="py-3 my-5">
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
                  </CardContent> */}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mx-auto w-full">
          <Card className="px-8 py-6 w-full relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col h-full items-center justify-center bg-white/900 dark:bg-neutral/90 backdrop-blur-xs z-10">
              <div className="absolute top-28 shadow-2xl border border-neutral-300 dark:border-neutral-800 rounded-xl p-10 px-8 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center">
                <Alert
                  color="default"
                  title="Your device is not registered."
                  description="Please register it to start monitoring your device"
                />
                <Button
                  variant="flat"
                  color="success"
                  className="w-full mt-8"
                  onClick={scanForDevices}
                  disabled={isScanning}
                >
                  {isScanning ? <Spinner size="sm" /> : "Register"}
                </Button>
              </div>
            </div>

            <CardContent style={{ padding: "0" }}>
              <div className="grid auto-rows-min gap-1 space-x-2  lg:grid-cols-3">
                <AmplitudeCard />
                <AccelerometerCard />
                <FrequencyCard />
              </div>
              <div className="grid grid-cols-1 space-x-2 md:grid-cols-2 py-4 lg:grid-cols-4 gap-1">
                <TemperatureCard />
                <VoltageCard />
                <TimestampCard />
                <AlertCard />
              </div>
            </CardContent>

          </Card>
        </div>
      )}

      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      >
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
              variant={"flat"}
              color="default"
              onClick={() => setShowRegisterModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="success"
              variant={"flat"}
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
