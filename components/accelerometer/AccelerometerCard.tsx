"use client";

import { CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { LineSquiggle } from "lucide-react";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Kbd } from "@heroui/kbd";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

export function AccelerometerCard() {
  // ✅ Grab deviceMetrics from context
  const { deviceMetrics } = useBluetoothSensor();

  return (
    <Card className="@container/card relative h-full transition-transform duration-300 pt-5 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7 xl:text-2xl text-xl">
          Accelerometer
        </CardDescription>

        <div className="flex items-start gap-2 mt-5">
          <div className="flex flex-col tabular-nums @[250px]/card:text-3xl text-[#818cf8] items-center">
            <span className="text-base text-muted-foreground">X</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestAccelX ?? "--"}
            </span>
          </div>
          <Divider className="h-12" orientation="vertical" />

          <div className="flex flex-col text-[#818cf8] items-center">
            <span className="text-base text-muted-foreground">Y</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestAccelY ?? "--"}
            </span>
          </div>
          <Divider className="h-12" orientation="vertical" />

          <div className="flex flex-col text-[#818cf8] items-center">
            <span className="text-base text-muted-foreground">Z</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestAccelZ ?? "--"}
            </span>
          </div>
        </div>

        <CardAction>
          <Kbd className="p-1.5 absolute top-5 right-5">
            <LineSquiggle size={22}  strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
