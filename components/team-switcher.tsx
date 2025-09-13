"use client";

import * as React from "react";
import { Bluetooth, ChevronsUpDown, SquarePlus, Trash2 } from "lucide-react";
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
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useBluetoothDevice } from "@/context/BluetoothDeviceContext";

export function DeviceSwitcher() {
  const { isMobile } = useSidebar();
  const {
    saveDevice,
    setShowCreateModal,
    showCreateModal,
    devices,
    activeDeviceId,
    deleteDevice, // ✅ get deleteDevice from context
  } = useBluetoothDevice();

  // Find the currently active device from the context
  const activeDevice = React.useMemo(() => {
    const device = devices.find(d => d.id.toString() === activeDeviceId);
    return device
      ? {
          name: device.name,
          logo: () => (
            <div className="flex size-10 w-10 h-8 items-center justify-center rounded-md border text-neutral-700 dark:text-neutral-300 dark:bg-neutral-950 bg-neutral-100">
              <Bluetooth size={17} />
            </div>
          ),
        }
      : {
          name: "No Device Selected",
          logo: () => (
            <div className="flex size-10 w-10 h-8 items-center justify-center rounded-md border text-neutral-700 dark:text-neutral-300 dark:bg-neutral-950 bg-neutral-100">
              <Bluetooth size={17} />
            </div>
          ),
        };
  }, [devices, activeDeviceId]);

  // Local state for new device name
  const [deviceName, setDeviceName] = React.useState("");

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <Dropdown
            showArrow
            placement={isMobile ? "bottom" : "right-start"}
            classNames={{
              base: "before:bg-default-200",
              content: "py-1 px-1 border border-default-200 bg-linear-to-br from-white to-default-200 dark:from-default-50 dark:to-black",
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
                  <span className="truncate font-medium">{activeDevice.name}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownTrigger>

            <DropdownMenu aria-label="Device Switcher">
              {/* Create Device */}
              <DropdownItem
                startContent={
                  <div className="flex size-6 items-center justify-center rounded-md">
                    <SquarePlus className="size-4" />
                  </div>
                }
                className="font-medium"
                onPress={() => setShowCreateModal(true)}
              >
                Create Device
              </DropdownItem>

              {/* Danger Zone */}
              <DropdownSection>
                <DropdownItem
                  startContent={<Trash2 className="size-4 ml-1 text-[#f31260]" />}
                  className="font-medium text-[#f31260] hover:text-[#f31260] dark:hover:text-[#f31260]"
                  onPress={deleteDevice} // ✅ call deleteDevice from context
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
              onPress={() => saveDevice(deviceName.trim())}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
