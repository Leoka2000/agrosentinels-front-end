"use client";

import { CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { LineSquiggle } from "lucide-react";
import { Card } from "@heroui/card";
import { Kbd } from "@heroui/kbd";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

export function AccelerometerCard() {
  const { deviceMetrics } = useBluetoothSensor();

  const axes = [
    { value: deviceMetrics?.latestAccelX ?? "--" },
    { value: deviceMetrics?.latestAccelY ?? "--" },
    { value: deviceMetrics?.latestAccelZ ?? "--" },
  ];

  return (
    <Card className="@container/card relative h-full transition-transform duration-300 pt-5 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7 xl:text-2xl text-xl">
          Accelerometer
        </CardDescription>

        {/* Inline layout with spacing */}
        <div className="flex items-center gap-6 mt-5">
          {axes.map((axis, i) => (
            <div
              key={i}
              className="flex items-baseline  text-[#818cf8] text-sm font-semibold"
            >
           
              <span className="text-2xl">{axis.value}</span>
              <span className="ml-1 font-extralight text-muted-foreground">
                m/s²
              </span>
            </div>
          ))}
        </div>

        <CardAction>
          <Kbd className="p-1.5 absolute top-5 right-5">
            <LineSquiggle size={22} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
