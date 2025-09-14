"use client";

import React from "react";
import { Button } from "@heroui/button";

import { ArrowBigRight, MoveRight, X } from "lucide-react";
import Link from "next/link";

export default function Banner() {
  return (
    <div className="border-divider bg-background/15 flex w-full items-center gap-x-3 border-b-1 px-6 py-2 backdrop-blur-xl sm:px-3.5 sm:before:flex-1">
      <p className="text-small text-foreground">
        <Link className="text-inherit" href="#">
          Agrosentinels mobile app coming soon &nbsp;
        </Link>
      </p>
     <Button
  as={Link}
  className="group text-small relative h-9 overflow-hidden bg-transparent font-normal"
  color="default"
  endContent={<ArrowBigRight size={15}/>}
  href="#"
  style={{
    border: "solid 2px transparent",
    backgroundImage: `linear-gradient(hsl(var(--heroui-background)), hsl(var(--heroui-background))), linear-gradient(to right, #22c55e, #facc15)`,
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
  }}
  variant="bordered"
>
  More
</Button>
      <div className="flex flex-1 justify-end"></div>
    </div>
  );
}
