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
        <CardDescription className="mb-7 text-xl">Amplitude</CardDescription>

        <div className="flex items-start gap-2 mt-5">
          <div className="flex flex-col tabular-nums @[250px]/card:text-3xl text-[#23bbbd] items-center">
            <span className="text-base text-muted-foreground">A1</span>
            <span className="xl:text-xl text-lg font-semibold">
              {deviceMetrics?.latestAmpl1 ?? "--"}
            </span>
          </div>
          <Divider className="h-12" orientation="vertical" />

          <div className="flex flex-col text-[#23bbbd] items-center">
            <span className="text-base text-muted-foreground">A2</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestAmpl2 ?? "--"}
            </span>
          </div>
          <Divider className="h-12" orientation="vertical" />

          <div className="flex flex-col text-[#23bbbd] items-center">
            <span className="text-base text-muted-foreground">A3</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestAmpl3 ?? "--"}
            </span>
          </div>
          <Divider className="h-12" orientation="vertical" />

          <div className="flex flex-col text-[#23bbbd] items-center">
            <span className="text-base text-muted-foreground">A4</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestAmpl4 ?? "--"}
            </span>
          </div>
        </div>
   
        <CardAction className="">
          <Kbd className="p-1.5 absolute top-5 right-5">
            <Activity size={22} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
