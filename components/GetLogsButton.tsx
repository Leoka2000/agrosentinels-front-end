"use client";

import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {Button, ButtonGroup} from "@heroui/button";

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

export default function GetLogsButton() {
  const [selectedOption, setSelectedOption] = React.useState(new Set(["1h"]));

  const optionsMap: Record<
    "1h" | "2h" | "3h" | "6h" | "12h" | "24h" | "48h",
    string
  > = {
    "1h": "1 hour before",
    "2h": "2 hours before",
    "3h": "3 hours before",
    "6h": "6 hours before",
    "12h": "12 hours before",
    "24h": "24 hours before",
    "48h": "48 hours before",
  };

  // Convert Set → Array → Value
  const selectedKey = Array.from(selectedOption)[0] as keyof typeof optionsMap;

  const handleSubmit = () => {
    const now = new Date();
    let offsetHours = parseInt(selectedKey.replace("h", ""), 10);

    // Subtract hours
    const pastDate = new Date(now.getTime() - offsetHours * 60 * 60 * 1000);

    // Convert to UNIX timestamp (seconds)
    const timestamp = Math.floor(pastDate.getTime() / 1000);

    // Convert to 8-char hex
    const hexTimestamp = timestamp.toString(16).toLowerCase().padStart(8, "0");

    console.log("Submitted value:", hexTimestamp);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <ButtonGroup variant="flat">
        <Button variant="flat" color={"success"} onClick={handleSubmit}>{optionsMap[selectedKey]}</Button>
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button variant="shadow" color="success" isIconOnly>
              <ChevronDownIcon />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Time selection"
            className="max-w-[300px]"
            selectedKeys={selectedOption}
            selectionMode="single"
            onSelectionChange={(keys) => setSelectedOption(new Set(typeof keys === "string" ? [keys] : Array.from(keys as Set<string>)))}
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
