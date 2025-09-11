"use client";

import { CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { AudioLines } from "lucide-react";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Kbd } from "@heroui/kbd";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

export function FrequencyCard() {
  // ✅ Grab deviceMetrics from context
  const { deviceMetrics } = useBluetoothSensor();

  return (
    <Card className="@container/card h-full relative transition-transform duration-300 pt-5 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7 text-xl">Frequency</CardDescription>

        <div className="flex items-start gap-2 mt-5">
          <div className="flex flex-col tabular-nums @[250px]/card:text-3xl text-[#25b64e] items-center">
            <span className="text-base text-muted-foreground">F1</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestFreq1 ?? "--"}
            </span>
          </div>
          <Divider className="h-12" orientation="vertical" />

          <div className="flex flex-col text-[#25b64e] items-center">
            <span className="text-base text-muted-foreground">F2</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestFreq2 ?? "--"}
            </span>
          </div>
          <Divider className="h-12" orientation="vertical" />

          <div className="flex flex-col text-[#25b64e] items-center">
            <span className="text-base text-muted-foreground">F3</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestFreq3 ?? "--"}
            </span>
          </div>
          <Divider className="h-12" orientation="vertical" />

          <div className="flex flex-col text-[#25b64e] items-center">
            <span className="text-base text-muted-foreground">F4</span>
            <span className="text-xl font-semibold">
              {deviceMetrics?.latestFreq4 ?? "--"}
            </span>
          </div>
        </div>

        <CardAction>
          <Kbd className="p-1.5 absolute top-5 right-5">
            <AudioLines size={22}  strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
