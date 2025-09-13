"use client";

import { CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { Gauge, LineSquiggle } from "lucide-react";
import { Card } from "@heroui/card";
import { Kbd } from "@heroui/kbd";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";
import { Divider } from "@heroui/divider";

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
        <CardDescription className="mb-9 font-bold text-2xl">
          Accelerometer
        </CardDescription>

        {/* Inline layout with spacing */}
        <div className="flex gap-1 ">
          {axes.map((axis, i) => (
            <div
              key={i}
              className="flex items-baseline mr-1  text-[#818cf8] text-sm font-semibold"
            >
           
              <span className="text-2xl font-bold">{axis.value}</span>
             
              <span className=" font-light text-muted-foreground">
                m/s²
              </span>
            </div>
          ))}
        </div>

        <CardAction>
          <Kbd className="p-1.5 absolute top-5 right-5">
            <Gauge size={22} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
