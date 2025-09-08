"use client";

import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Activity, LineSquiggle } from "lucide-react";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Kbd } from "@heroui/kbd";

export function AmplitudeCard() {
  return (
    <Card className="@container/card h-full transition-transform duration-300 pt-5 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7 lg:text-2xl text-sm ">
          Amplitude 
        </CardDescription>
        <div className="flex items-start gap-2 mt-5">
          <div className="flex flex-col tabular-nums  text-[#23bbbd] items-center">
            <span className="md:text-base text-muted-foreground">X</span>
            <span className="md:text-xl font-semibold">323</span>
          </div>
          <Divider className="h-14" orientation="vertical" />
          <div className="flex flex-col  text-[#23bbbd]  items-center">
            <span className="text-base  text-muted-foreground">Y</span>
            <span className="md:text-xl   font-semibold">2322</span>
          </div>
          <Divider className="h-14 " orientation="vertical" />
          <div className="flex flex-col  text-[#23bbbd]  items-center">
            <span className="text-base text-muted-foreground">Z</span>
            <span className="md:text-xl   font-semibold">12380</span>
          </div>
          <Divider className="h-14 " orientation="vertical" />
          <div className="flex flex-col  text-[#23bbbd]  items-center">
            <span className="text-base text-muted-foreground">D</span>
            <span className="md:text-xl  font-semibold">1123</span>
          </div>
        </div>
        <CardAction>
          <Kbd className="p-2">
            <Activity size={25} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
