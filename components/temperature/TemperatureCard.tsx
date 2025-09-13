"use client";

import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Card } from "@heroui/card";
import { Kbd } from "@heroui/kbd";
import { ThermometerSun } from "lucide-react";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

export function TemperatureCard() {
  const { deviceMetrics } = useBluetoothSensor();

  return (
    <Card className="@container/card relative h-full transition-transform duration-300 ease-in-out pt-5 hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7 font-bold text-xl">Temperature</CardDescription>
        <CardTitle className="text-3xl font-semibold text-[#db2777] tabular-nums">
          {deviceMetrics?.latestTemperature
            ? `${deviceMetrics.latestTemperature.toFixed(1)} `
            : "--"}
            <span className="text-base  font-light text-muted-foreground">°C</span>
        </CardTitle>
        <CardAction>
          <Kbd className="p-1.5 absolute top-5 right-5">
            <ThermometerSun size={22}  strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
