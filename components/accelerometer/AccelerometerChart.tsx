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

interface AccelerometerChartProps {
  status: string;
}

interface AccelerometerDataPoint {
  x: number;
  y: number;
  z: number;
  timestamp: string; // ISO string from backend
  date?: string; // formatted for chart axis
}

// Chart colors for each axis
const chartConfig = {
  x: { label: "X Axis", color: "#f472b6" }, // pink
  y: { label: "Y Axis", color: "#34d399" }, // green
  z: { label: "Z Axis", color: "#60a5fa" }, // blue
} satisfies ChartConfig;

const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

export const AccelerometerChart = ({ status }: AccelerometerChartProps) => {
  const [data, setData] = React.useState<AccelerometerDataPoint[]>([]);
  const [range, setRange] = React.useState("day");
  const [deviceId, setDeviceId] = React.useState<number | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const statusColorClass =
    status === "Disconnected"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-300";

  // Fetch active device
  React.useEffect(() => {
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

  // Fetch accelerometer history
  React.useEffect(() => {
    if (!deviceId) return;

    const fetchHistoricalData = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE_URL}/api/accelerometer/history?range=${range}&deviceId=${deviceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch accelerometer history");
        const body: AccelerometerDataPoint[] = await res.json();

        // Format ISO timestamp for chart's x-axis
        const formattedData = body.map((point) => ({
          ...point,
          date: new Date(point.timestamp).toLocaleString("en-GB", {
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
        <div className="flex flex-1 flex-col justify-center gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <h1 className="2xl font-bold">Accelerometer</h1>
          <div className="flex items-center justify-between">
            <p className="leading-4 text-sm py-1">
              <span className={`text-sm font-semibold ${statusColorClass}`}>
                {status}
              </span>
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

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[250px] w-full"
      >
        <AreaChart data={data} margin={{ left: 12, right: 12 }}>
          <defs>
            <linearGradient id="fillX" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-x)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-x)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillY" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-y)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-y)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillZ" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-z)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-z)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `${value}`}
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
                className="w-[200px]"
                nameKey="accelerometer"
                labelFormatter={(value: any) => value}
                valueFormatter={(val, props) => `${val}`}
                keys={["x", "y", "z"]}
              />
            }
          />
          {/* Three Area lines for x, y, z */}
          <Area
            dataKey="x"
            type="monotone"
            fill="url(#fillX)"
            stroke="var(--color-x)"
            strokeWidth={2}
            isAnimationActive={true}
          />
          <Area
            dataKey="y"
            type="monotone"
            fill="url(#fillY)"
            stroke="var(--color-y)"
            strokeWidth={2}
            isAnimationActive={true}
          />
          <Area
            dataKey="z"
            type="monotone"
            fill="url(#fillZ)"
            stroke="var(--color-z)"
            strokeWidth={2}
            isAnimationActive={true}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
};
