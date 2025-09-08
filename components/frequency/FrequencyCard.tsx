"use client";

import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Activity, AudioLines, LineSquiggle } from "lucide-react";
import { Card } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Kbd } from "@heroui/kbd";

export function FrequencyCard() {
  return (
    <Card className="@container/card h-full transition-transform duration-300 pt-5 ease-in-out  hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription className="mb-7 text-2xl ">Frequency</CardDescription>
        <div className="flex items-start gap-2 mt-5">
          <div className="flex flex-col tabular-nums  @[250px]/card:text-3xl  text-[#25b64e] items-center">
            <span className="text-base text-muted-foreground">X</span>
            <span className="text-xl font-semibold">2323</span>
          </div>
          <Divider className="h-12" orientation="vertical" />
          <div className="flex flex-col  text-[#25b64e] items-center">
            <span className="text-base  text-muted-foreground">Y</span>
            <span className="text-xl  font-semibold">2342 </span>
          </div>
          <Divider className="h-12 " orientation="vertical" />
          <div className="flex flex-col  text-[#25b64e]  items-center">
            <span className="text-base text-muted-foreground">Z</span>
            <span className="text-xl  font-semibold">6380</span>
          </div>
          <Divider className="h-12 " orientation="vertical" />
          <div className="flex flex-col  text-[#25b64e]  items-center">
            <span className="text-base text-muted-foreground">D</span>
            <span className="text-xl  font-semibold">23</span>
          </div>
        </div>
        <CardAction>
          <Kbd className="p-2">
            <AudioLines size={25} strokeWidth={1.2} />
          </Kbd>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
