"use client";

import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { LineSquiggle } from "lucide-react";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Kbd } from "@heroui/kbd";

export function AccelerometerCard() {
  return (
    <Card className="@container/card h-full  transition-transform duration-300 ease-in-out pt-5  hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7 text-2xl ">
          Accelerometer data
        </CardDescription>
 
        <div className="flex items-start gap-2 mt-5">
          <div className="flex flex-col tabular-nums  @[250px]/card:text-3xl  text-[#818cf8]  items-center">
            <span className="text-base text-muted-foreground">X</span>
            <span className="text-xl font-semibold">36723</span>
          </div>
          <Divider className="h-14 mx-1" orientation="vertical" />
          <div className="flex flex-col  text-[#818cf8]  items-center">
            <span className="text-base  text-muted-foreground">Y</span>
            <span className="text-xl  font-semibold">232</span>
          </div>
          <Divider className="h-14 mx-1" orientation="vertical" />
          <div className="flex flex-col  text-[#818cf8]  items-center">
            <span className="text-base text-muted-foreground">Z</span>
            <span className="text-xl  font-semibold">18880</span>
          </div>
        </div>
        <CardAction>
          <Kbd className="p-2">
            <LineSquiggle size={25} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
