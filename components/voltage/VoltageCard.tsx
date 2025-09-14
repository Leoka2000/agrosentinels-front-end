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

  const voltage = deviceMetrics?.latestVoltage ?? null;

  // Map voltage into 0–100% (scale from 3.0V to 4.3V)
  const percent = voltage
    ? Math.min(Math.max(((voltage - 3.0) / (4.3 - 3.0)) * 100, 0), 100)
    : null;

  // Boss’s rules for battery color
  let batteryColor = "bg-green-500";
  if (voltage != null) {
    if (voltage <= 3.5) batteryColor = "bg-red-500";
    else if (voltage <= 3.8) batteryColor = "bg-yellow-500";
    else batteryColor = "bg-green-500";
  }

  return (
    <Card className="@container/card relative h-full transition-transform duration-300 ease-in-out pt-5 hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className=" font-bold text-xl">
          Voltage
        </CardDescription>

        <div className="flex flex-col gap-1">
          {/* Show raw voltage value */}
          <CardTitle className="text-3xl gap-1 mb-2 flex items-baseline font-semibold  tabular-nums">
            {voltage != null ? voltage.toFixed(2) : "--"}
            <span className="text-base font-light text-muted-foreground">
              {" "}
              V
            </span>
          </CardTitle>

          {/* Custom battery gauge */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-8 border-2 border-neutral-500 dark:border-neutral-800 rounded-md flex items-center">
              {percent != null && (
                <div
                  className={`${batteryColor} h-full rounded-sm transition-all duration-300`}
                  style={{ width: `${percent}%` }}
                />
              )}
              {/* Battery cap */}
              <div className="absolute right-[-6px] w-1 h-4 bg-neutral-500 dark:bg-neutral-800 rounded-xs"></div>
            </div>
            <p className="text-muted-foreground text-lg">{percent?.toFixed(0)}%</p>
          </div>
        </div>

        <CardAction>
          <Kbd className="p-1.5 absolute top-5 right-5">
            <BatteryFull size={22} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
