"use client";

import { CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { AudioLines } from "lucide-react";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Kbd } from "@heroui/kbd";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

export function FrequencyCard() {
  const { deviceMetrics } = useBluetoothSensor();

  const frequencies = [
    deviceMetrics?.latestFreq1 ?? "--",
    deviceMetrics?.latestFreq2 ?? "--",
    deviceMetrics?.latestFreq3 ?? "--",
    deviceMetrics?.latestFreq4 ?? "--",
  ];

  return (
    <Card className="@container/card h-full nunito-custom relative transition-transform duration-300 pt-5 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-3 font-bold text-2xl">Frequency</CardDescription>

        <div className="flex flex-col items-baseline  space-y-4">
          {/* Top two values */}
          <div className="grid grid-cols-2 gap-x-10">
            {frequencies.slice(0, 2).map((freq, i) => (
              <div
                key={i}
                className="flex items-baseline text-[#25b64e] text-xl"
              >
                <span className="font-bold  text-2xl">{freq}</span>
                <span className="ml-1 text-sm font-light text-muted-foreground">
                  Hz
                </span>
              </div>
            ))}
          </div>

          {/* Divider between top and bottom */}
          <Divider className="w-42 rounded-full" />

          {/* Bottom two values */}
          <div className="grid grid-cols-2 gap-x-8">
            {frequencies.slice(2, 4).map((freq, i) => (
              <div
                key={i + 2}
                className="flex items-baseline text-[#25b64e] text-xl"
              >
                <span className="font-semibold text-2xl">{freq}</span>
                <span className="ml-1 text-sm font-light text-muted-foreground">
                  Hz
                </span>
              </div>
            ))}
          </div>
        </div>

        <CardAction>
          <Kbd className="p-1.5 absolute top-5 right-5">
            <AudioLines size={22} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
