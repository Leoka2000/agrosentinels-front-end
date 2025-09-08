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
import { ThermometerSun } from "lucide-react";

export function TemperatureCard() {
  return (
    <Card className="@container/card h-[10rem] transition-transform duration-300 ease-in-out pt-5 hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7 text-2xl ">Temperature</CardDescription>
       
        <CardTitle className="text-3xl font-semibold text-[#fb7185] tabular-nums @[250px]/card:text-3xl">
          37C
        </CardTitle>
        <CardAction>
          <Kbd className="p-2">
            <ThermometerSun size={25} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
   
     
    </Card>
  );
}
