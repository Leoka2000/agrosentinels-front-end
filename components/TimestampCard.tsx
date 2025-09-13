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
import { AlarmClockCheck, BatteryFull, ThermometerSun, Timer } from "lucide-react";

export function TimestampCard() {
  return (
    <Card className="@container/card h-full  pt-5 transition-transform duration-300 ease-in-out  hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-5 font-bold text-xl ">
          Last update
        </CardDescription>

        <CardTitle className="xl:text-xl text-lg font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums ">
       ---
        </CardTitle>
        <CardAction>
          <Kbd className="p-1.5">
        <AlarmClockCheck size={22}  strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
