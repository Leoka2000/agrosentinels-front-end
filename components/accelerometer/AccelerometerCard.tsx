"use client";

import { CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { Gauge, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@heroui/card";
import { Kbd } from "@heroui/kbd";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

export function AccelerometerCard() {
  const { deviceMetrics } = useBluetoothSensor();

  const axes = [
    { label: "X", value: deviceMetrics?.latestAccelX },
    { label: "Y", value: deviceMetrics?.latestAccelY },
    { label: "Z", value: deviceMetrics?.latestAccelZ },
  ];

  return (
    <Card className="@container/card relative h-full transition-transform duration-300 pt-5 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-9 font-bold text-2xl">
          Accelerometer
        </CardDescription>

        <div className="flex gap-3">
          {axes.map((axis, i) => {
            const numericValue = axis.value ?? NaN;
            return (
              <div
                key={i}
                className="flex relative  flex-col-reverse gap-1 text-[#818cf8] text-sm font-semibold"
              >
                <div className="text-2xl flex items-baseline font-bold">
                   {numericValue != null &&
                  (numericValue >= 0 ? (
                    <TrendingUp className="w-4 h-4 absolute -top-1 right-0 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 absolute -top-1 right-0 text-red-500" />
                  ))}
                  {numericValue != null ? numericValue.toFixed(2) : "--"}
                  <span className="font-light text-sm text-muted-foreground">m/s²</span> 
                </div>


               
              </div>
              
            );
          })}
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
