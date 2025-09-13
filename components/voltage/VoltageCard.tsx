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
import BatteryGauge from "react-battery-gauge";

export function VoltageCard() {
  const { deviceMetrics } = useBluetoothSensor();

  const voltage = deviceMetrics?.latestVoltage ?? 0;

  // Map voltage to 0-100 scale for react-battery-gauge
  const gaugeValue = Math.min(Math.max(((voltage - 3) / (4.3 - 3)) * 100, 0), 100);

  // Determine color based on documentation
  let batteryColor = "green";
  if (voltage <= 3.5) batteryColor = "red";
  else if (voltage <= 3.8) batteryColor = "yellow";
  else batteryColor = "green";

  return (
    <Card className="@container/card relative h-full transition-transform duration-300 ease-in-out pt-5 hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-5 font-bold text-xl">Voltage</CardDescription>

        <div className="flex items-center gap-6">
          <CardTitle className="text-3xl font-semibold dark:text-[#fff822] text-[#b4d10e] tabular-nums">
            {voltage ? voltage.toFixed(2) : "--"}
            <span className="text-base font-light text-muted-foreground"> V</span>
          </CardTitle>

          <BatteryGauge
            value={gaugeValue}
            maxValue={100}

            size={90}
            orientation="horizontal"
            customization={{
              batteryMeter: {
                fill: batteryColor,
                lowBatteryValue: 15,
                lowBatteryFill: "red",
                outerGap: 1,
                noOfCells: 1,
                interCellsGap: 1,
              },
              readingText: { showPercentage: true },
            }}
          />
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
