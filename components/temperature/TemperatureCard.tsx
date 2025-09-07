"use client";

import {
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Card } from "@heroui/card";
import { ThermometerSun } from "lucide-react";

export function TemperatureCard() {
  return (
    <Card className="@container/card transition-transform duration-300 ease-in-out pt-2 pb-5 hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription>Temperature received</CardDescription>
        <CardTitle className="text-2xl font-semibold text-[#fb7185] tabular-nums @[250px]/card:text-3xl">
          No data yet
        </CardTitle>
        <CardAction>
          <span className="flex bg-neutral-50 shadow-sm text-gray-500 text-xs font-medium me-2 px-2 py-1 rounded-lg dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 border dark:border-neutral-700">
            <ThermometerSun size={25} strokeWidth={1.2} />
          </span>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-xs">
        {/* Change indicator removed */}
        <div className="text-muted-foreground">
          Time elapsed since last update: <br />
          {/* Elapsed time removed */}
        </div>
      </CardFooter>
    </Card>
  );
}
