"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Trash2 } from "lucide-react";

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

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState({
    name: "Team Alpha",
    logo: () => <div className="bg-blue-500 w-6 h-6 rounded-full" />,
    plan: "Pro",
  });

  if (!activeTeam) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem      >
        
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
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownTrigger>

          <DropdownMenu aria-label="Team Switcher" variant="faded">
            {/* Hard-coded Teams */}
            <DropdownSection title="Teams">
              <DropdownItem
                 description="Change to device 1"
                startContent={
                  <div className="flex size-6 items-center justify-center rounded-md border bg-blue-500">
                    <div className="size-3.5" />
                  </div>
                }
                shortcut="⌘1"
         
                onPress={() =>
                  setActiveTeam({
                    name: "Team Alpha",
                    logo: () => <div className="bg-blue-500 w-6 h-6 rounded-full" />,
                    plan: "Pro",
                  })
                }
              >
                Team Alpha
              </DropdownItem>

              <DropdownItem
               description="Change to device 2"
                startContent={
                  <div className="flex size-6 items-center justify-center rounded-md border bg-green-500">
                    <div className="size-3.5" />
                  </div>
                }
                shortcut="⌘2"
                onPress={() =>
                  setActiveTeam({
                    name: "Team Beta",
                    logo: () => <div className="bg-green-500 w-6 h-6 rounded-full" />,
                    plan: "Starter",
                  })
                }
              >
                Team Beta
              </DropdownItem>
            </DropdownSection>

            {/* Add Team */}
            <DropdownItem
              startContent={
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
              }
                  
              className=" font-medium"
              onPress={() => alert("Add new team")}
            >
              Add team
            </DropdownItem>

            {/* Danger Zone */}
            <DropdownSection title="Danger Zone">
              <DropdownItem
                startContent={<Trash2 className="size-4 text-[#f31260] " />}
                className="font-medium text-[#f31260] hover:text-[#f31260] dark:hover:text-[#f31260]"
                onPress={() => alert(`⚠️ Deleting device: ${activeTeam.name}`)}
              >
                Delete Device
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
