"use client";

import React from "react";
import { useBluetoothSensor } from "@/context/useBluetoothSensor";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button, ButtonGroup } from "@heroui/button";

interface GetLogsButtonProps {
  localConnected: boolean;
}

export const ChevronDownIcon = () => {
  return (
    <svg
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.9188 8.17969H11.6888H6.07877C5.11877 8.17969 4.63877 9.33969 5.31877 10.0197L10.4988 15.1997C11.3288 16.0297 12.6788 16.0297 13.5088 15.1997L15.4788 13.2297L18.6888 10.0197C19.3588 9.33969 18.8788 8.17969 17.9188 8.17969Z"
        fill="currentColor"
      />
    </svg>
  );
};
export default function GetLogsButton({ localConnected }: GetLogsButtonProps) {
  const [selectedOption, setSelectedOption] = React.useState(new Set(["1h"]));
  const { activeDevice, getHistoricalLogs } = useBluetoothSensor();

  const optionsMap: Record<string, string> = {
    "10s": "10 seconds ago",
    "1m": "1 minute ago",
    "15m": "15 minutes ago",
    "20m": "20 minutes ago",
    "30m": "30 minutes ago",
    "1h": "1 hour ago",
    "2h": "2 hours ago",
    "3h": "3 hours ago",
    "6h": "6 hours ago",
    "12h": "12 hours ago",
    "24h": "24 hours ago",
    "48h": "48 hours ago",
  };

  const selectedKey = Array.from(selectedOption)[0];

  const handleSubmit = async () => {
    if (!activeDevice) {
      console.warn("No active device selected");
      return;
    }

    const now = new Date();
    let pastDate: Date;

    if (selectedKey.endsWith("s")) {
      const seconds = parseInt(selectedKey.replace("s", ""), 10);
      pastDate = new Date(now.getTime() - seconds * 1000);
    } else if (selectedKey.endsWith("m")) {
      const minutes = parseInt(selectedKey.replace("m", ""), 10);
      pastDate = new Date(now.getTime() - minutes * 60 * 1000);
    } else if (selectedKey.endsWith("h")) {
      const hours = parseInt(selectedKey.replace("h", ""), 10);
      pastDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
    } else {
      console.error("Invalid selected key", selectedKey);
      return;
    }

    const timestamp = Math.floor(pastDate.getTime() / 1000);
    const hexTimestamp = timestamp.toString(16).toLowerCase().padStart(8, "0");

    console.log("Fetching logs from timestamp:", hexTimestamp);

    await getHistoricalLogs(activeDevice.logReadCharUuid, hexTimestamp);
  };

  return (
    <div className="flex flex-col ml-2 items-center gap-4">
      <ButtonGroup variant="flat">
        <Button
          isDisabled={!localConnected}
          variant="flat"
          color="success"
          onClick={handleSubmit}
        >
          {optionsMap[selectedKey]}
        </Button>
        <Dropdown
          classNames={{
            base: "before:bg-default-200",
            content:
              "py-1 px-1 border border-default-200 bg-linear-to-br from-white to-default-50 dark:from-default-50 dark:to-default-950",
          }}
          placement="bottom-end"
        >
          <DropdownTrigger>
            <Button
              isDisabled={!localConnected}
              variant="shadow"
              color="success"
              isIconOnly
            >
              <ChevronDownIcon />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Time selection"
            className="max-w-[300px]"
            selectedKeys={selectedOption}
            selectionMode="single"
            onSelectionChange={(keys) =>
              setSelectedOption(
                new Set(
                  typeof keys === "string"
                    ? [keys]
                    : Array.from(keys as Set<string>)
                )
              )
            }
          >
            {Object.entries(optionsMap).map(([key, label]) => (
              <DropdownItem key={key}>{label}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>
    </div>
  );
}
