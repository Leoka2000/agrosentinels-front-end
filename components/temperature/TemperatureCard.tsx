"use client";

import {
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Card } from "@heroui/card";
import { Kbd } from "@heroui/kbd";
import { ThermometerSun } from "lucide-react";

export function TemperatureCard() {
  return (
    <Card className="@container/card transition-transform duration-300 ease-in-out p-5 pt-8 pb-24  hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="text-lg">Temperature received</CardDescription>
        <CardTitle className="text-4xl font-semibold text-[#fb7185] tabular-nums @[250px]/card:text-3xl">
          No data yet
        </CardTitle>
        <CardAction>
          <Kbd className="p-2">
            <ThermometerSun size={25} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-xs">
        {/* Change indicator removed */}
        <div className="text-muted-foreground text-lg">
          Time elapsed since last update: <br />
          {/* Elapsed time removed */}
        </div>
      </CardFooter>
    </Card>
  );
}
