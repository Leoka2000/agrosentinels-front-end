"use client";

import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Card } from "@heroui/card";
import { Kbd } from "@heroui/kbd";
import { BatteryFull } from "lucide-react";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

export function VoltageCard() {
  const { deviceMetrics } = useBluetoothSensor();

  return (
    <Card className="@container/card relative h-[10rem] transition-transform duration-300 ease-in-out pt-5 hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7  text-xl">Voltage</CardDescription>
        <CardTitle className="text-3xl font-semibold dark:text-[#fff822] text-[#b4d10e] tabular-nums">
          {deviceMetrics?.latestVoltage
            ? `${deviceMetrics.latestVoltage.toFixed(1)} `
            : "--"}
               <span className="text-base  font-extralight text-muted-foreground">V</span>
        </CardTitle>
        <CardAction>
           <Kbd className="p-1.5 absolute top-5 right-5">
            <BatteryFull size={22}  strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
