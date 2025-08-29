"use client";

import * as React from "react";
import { Bluetooth, ChevronsUpDown, Plus, Trash2 } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { getToken } from "@/lib/auth";

export function DeviceSwitcher() {
  const { isMobile } = useSidebar();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Active device state
  const [activeDevice, setActiveDevice] = React.useState<{
    name: string;
    logo: React.FC;
  }>({
    name: "No Device Selected",
    logo: () => (
      <div className="flex size-10 w-10 h-8 items-center justify-center rounded-md border text-neutral-700 dark:text-neutral-300 dark:bg-neutral-950 bg-neutral-100">
        <Bluetooth size={17} />
      </div>
    ),
  });

  // Modal + form state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [deviceName, setDeviceName] = React.useState("");

  if (!activeDevice) return null;

  // --- Save Device ---
  const saveDevice = async () => {
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const payload = {
        name: deviceName,
        serviceUuid: null,
        measurementCharUuid: null,
        logReadCharUuid: null,
        setTimeCharUuid: null,
        ledControlCharUuid: null,
        sleepControlCharUuid: null,
        alarmCharUuid: null,
      };

      const res = await fetch(`${API_BASE_URL}/api/device/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save device");

      addToast({ title: "Device created successfully", color: "success" });

      // Update UI with new active device
      setActiveDevice({
        name: deviceName,
        logo: () => (
          <div className="flex size-10 w-10 h-8 items-center justify-center rounded-md border dark:bg-neutral-950 bg-neutral-100">
            <Bluetooth size={17} />
          </div>
        ),
      });

      setShowCreateModal(false);
      setDeviceName("");
    } catch (err) {
      console.error(err);
      addToast({ title: "Error saving device", color: "danger" });
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <Dropdown
            showArrow
            placement={isMobile ? "bottom" : "right-start"}
            classNames={{
              base: "before:bg-default-200",
              content:
                "py-1 px-1 border border-default-200 bg-linear-to-br from-white to-default-200 dark:from-default-50 dark:to-black",
            }}
          >
            <DropdownTrigger>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <activeDevice.logo />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeDevice.name}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownTrigger>

            <DropdownMenu aria-label="Device Switcher" variant="faded">
              {/* Create Device */}
              <DropdownItem
                startContent={
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                }
                className="font-medium"
                onPress={() => setShowCreateModal(true)}
              >
                Create Device
              </DropdownItem>

              {/* Danger Zone */}
              <DropdownSection >
                <DropdownItem
                  startContent={<Trash2 className="size-4 text-[#f31260]" />}
                  className="font-medium text-[#f31260] hover:text-[#f31260] dark:hover:text-[#f31260]"
                  onPress={() =>
                    alert(`⚠️ Deleting device: ${activeDevice.name}`)
                  }
                >
                  Delete Device
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Create Device Modal */}
      <Modal isOpen={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent>
          <ModalHeader>Create Device</ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            <Input
              label="Device Name"
              placeholder="Enter device name"
              value={deviceName}
              onValueChange={setDeviceName}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              color="success"
              isDisabled={!deviceName.trim()}
              onPress={saveDevice}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
