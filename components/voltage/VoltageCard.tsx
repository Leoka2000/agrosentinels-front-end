"use client";

import {
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Kbd } from "@heroui/kbd";
import { BatteryFull, ThermometerSun } from "lucide-react";

export function VoltageCard() {
  return (
    <Card className="@container/card h-[10rem] pt-5 transition-transform duration-300 ease-in-out  hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-5 text-2xl ">
          Voltage
        </CardDescription>

        <CardTitle className="text-3xl font-semibold text-[#fbd871] tabular-nums ">
          3,64 V
        </CardTitle>
        <CardAction>
          <Kbd className="p-2">
            <BatteryFull size={25} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>

     
    </Card>
  );
}
