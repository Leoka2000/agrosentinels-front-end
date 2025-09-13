"use client";

import { CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Kbd } from "@heroui/kbd";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

export function AmplitudeCard() {
  const { deviceMetrics } = useBluetoothSensor();

  return (
    <Card className="@container/card relative h-full transition-transform duration-300 pt-5 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-4 text-xl">Amplitude</CardDescription>

        <div className="flex flex-col items-baseline  space-y-4">
          {/* Top two amplitudes */}
          <div className="grid grid-cols-2 gap-x-10">
            <div className="flex  items-baseline gap-1 text-[#23bbbd]">
              <span className="text-2xl  font-semibold">
                {deviceMetrics?.latestAmpl1 ?? "--"}
              </span>
              <span className="text-sm text-muted-foreground">
                m/s²
              </span>
            </div>
            <div className="flex  items-baseline gap-1 text-[#23bbbd]">
              <span className="text-2xl  font-semibold">
                {deviceMetrics?.latestAmpl2 ?? "--"}
              </span>
              <span className="text-sm text-muted-foreground">
                m/s²
              </span>
            </div>
          </div>

          {/* Divider */}
          <Divider className="w-3/4 rounded-full" />

          {/* Bottom two amplitudes */}
          <div className="grid grid-cols-2 gap-x-14">
            <div className="flex  items-baseline gap-1 text-[#23bbbd]">
              <span className="text-2xl  font-semibold">
                {deviceMetrics?.latestAmpl3 ?? "--"}
              </span>
              <span className="text-sm text-muted-foreground">
                m/s²
              </span>
            </div>
            <div className="flex  items-baseline gap-1 text-[#23bbbd]">
              <span className="text-2xl  font-semibold">
                {deviceMetrics?.latestAmpl4 ?? "--"}
              </span>
              <span className="text-sm text-muted-foreground">
                m/s²
              </span>
            </div>
          </div>
        </div>

        <CardAction>
          <Kbd className="p-1.5 absolute top-5 right-5">
            <Activity size={22} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
