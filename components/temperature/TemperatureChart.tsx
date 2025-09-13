"use client";

import React, { useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getToken } from "@/lib/auth";
import { Kbd } from "@heroui/kbd";
import { BatteryFull, Funnel, ThermometerSun } from "lucide-react";

interface TemperatureDataPoint {
  timestamp: number; // unix timestamp from backend
  temperature: number | null;
  date?: string; // formatted for chart
}

const chartConfig = {
  temperature: {
    label: "Temperature",
    color: "#db2777",
  },
} satisfies ChartConfig;

const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

export const TemperatureChart = () => {
  const [data, setData] = React.useState<TemperatureDataPoint[]>([]);
  const [range, setRange] = React.useState("day");
  const [deviceId, setDeviceId] = React.useState<number | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const statusColorClass =
    status === "Disconnected"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-300";

  useEffect(() => {
    const fetchActiveDevice = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/device/active`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch active device");
        const body = await res.json();
        setDeviceId(body.deviceId);
      } catch (err) {
        console.error(err);
      }
    };
    fetchActiveDevice();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!deviceId) return;

    const fetchHistoricalData = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE_URL}/api/temperature/history?range=${range}&deviceId=${deviceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch temperature history");
        const body: TemperatureDataPoint[] = await res.json();

        const formattedData = body.map((point) => ({
          ...point,
          date: new Date(point.timestamp * 1000).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        }));

        setData(formattedData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistoricalData();
  }, [range, deviceId, API_BASE_URL]);

  return (
    <Card className="p-4">
      <CardBody className="flex z-10 flex-col items-stretch !p-0 sm:flex-row">
        <div className="flex flex-1 items-center  justify-start h-full gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <Kbd className="p-2 mr-3 ">
            <ThermometerSun size={18} strokeWidth={1.7} />
          </Kbd>
          <h1 className="text-xl font-light ">Temperature</h1>
        </div>

        <div className="flex flex-col justify-center gap-1 px-6 py-4">
          <Dropdown className="py-1 px-1 border border-default-200 bg-linear-to-br from-white to-default-200 dark:from-default-50 dark:to-black">
            <DropdownTrigger>
              <Button
                className="capitalize border border-default-200 bg-linear-to-br from-white to-default-200 dark:from-default-50 dark:to-black"
                variant="flat"
              >
                {ranges.find((r) => r.value === range)?.label}
                <Kbd className="px-2 py-1">
                  <Funnel size={15} />
                </Kbd>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={new Set([range])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setRange(selected);
              }}
              aria-label="Select data range"
            >
              {ranges.map((r) => (
                <DropdownItem key={r.value}>{r.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardBody>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[250px] w-full"
      >
        <AreaChart data={data} margin={{ left: 12, right: 12 }}>
          <defs>
            <linearGradient id="fillTemperature" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-temperature)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-temperature)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `${value}°C`}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[150px]"
                nameKey="temperature"
                labelFormatter={(value: any) => value}
              />
            }
          />
          <Area
            dataKey="temperature"
            type="monotone"
            fill="url(#fillTemperature)"
            stroke="var(--color-temperature)"
            strokeWidth={2}
            isAnimationActive={true}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
};
