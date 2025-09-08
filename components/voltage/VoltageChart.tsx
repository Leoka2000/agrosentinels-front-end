"use client";

import * as React from "react";
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
import { Funnel } from "lucide-react";

interface VoltageChartProps {
  status: string;
}

interface VoltageDataPoint {
  timestamp: number; // unix timestamp from backend
  voltage: number | null;
  date?: string; // human-readable string for chart
}

const chartConfig = {
  voltage: {
    label: "Voltage",
    color: "#fcd34d",
  },
} satisfies ChartConfig;

const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

export const VoltageChart = ({ status }: VoltageChartProps) => {
  const [data, setData] = React.useState<VoltageDataPoint[]>([]);
  const [range, setRange] = React.useState("day");
  const [deviceId, setDeviceId] = React.useState<number | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const statusColorClass =
    status === "Disconnected"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-300";

  // Fetch active device once
  React.useEffect(() => {
    const fetchActiveDevice = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/device/active`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

  // Fetch voltage history whenever range or deviceId changes
  React.useEffect(() => {
    if (!deviceId) return;

    const fetchHistoricalData = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE_URL}/api/voltage/history?range=${range}&deviceId=${deviceId}`,
          {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch voltage history");
        const body: VoltageDataPoint[] = await res.json();

        // Convert unix timestamp to human-readable date
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
    <Card className="p-4 ">
      <CardBody className="flex z-10 flex-col items-stretch !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <h1 className="2xl font-bold">Battery Voltage</h1>
          <div className="flex items-center justify-between">
            <p className="leading-4 text-sm py-1">
              <span className={`text-sm font-semibold ${statusColorClass}`}>{status}</span>
            </p>
          </div>
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

      <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
        <AreaChart data={data} margin={{ left: 12, right: 12 }}>
          <defs>
            <linearGradient id="fillVoltage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-voltage)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-voltage)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `${value}V`}
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
                nameKey="voltage"
                labelFormatter={(value: any) => value}
                valueFormatter={(val) => `${val} V`}
              />
            }
          />
          <Area
            dataKey="voltage"
            type="monotone"
            fill="url(#fillVoltage)"
            stroke="var(--color-voltage)"
            strokeWidth={2}
            isAnimationActive={true}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
};
