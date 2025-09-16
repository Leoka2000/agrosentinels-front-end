"use client";

import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBluetoothSensor } from "@/context/useBluetoothSensor";
import { Card } from "@heroui/card";
import { Kbd } from "@heroui/kbd";
import { AlarmClockCheck } from "lucide-react";

export function TimestampCard() {
  const { deviceMetrics } = useBluetoothSensor();

  // Convert UNIX timestamp (seconds) to readable date
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000); 
    return date.toLocaleString(); // e.g. "9/16/2025, 10:14:51 AM"
  };

  
  return (
    <Card className="@container/card h-full pt-5 transition-transform duration-300 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-5 font-bold text-xl">
          {deviceMetrics?.lastReceivedTimestamp ? "Last Update" : "No Data"}
        </CardDescription>

        <CardTitle className="xl:text-xl text-lg font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
          {deviceMetrics?.lastReceivedTimestamp
            ? formatTimestamp(deviceMetrics.lastReceivedTimestamp)
            : "---"}
        </CardTitle>

        <CardAction>
          <Kbd className="p-1.5">
            <AlarmClockCheck size={22} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
