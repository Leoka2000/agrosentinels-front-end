"use client";

import React, { useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
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
import { useAuth } from "@/context/AuthContext";

// --------------------------- Interfaces ---------------------------
// Represents a single data point for the voltage chart
interface VoltageDataPoint {
  timestamp: number;         // Unix timestamp
  voltage: number | null;    // Voltage value, can be null
  date?: string;             // Optional formatted date string for X-axis
}

// --------------------------- Chart Configuration ---------------------------
// Defines labels and colors for the chart
const chartConfig = {
  voltage: {
    label: "Voltage",
    color: "#fcd34d", // Yellow color for voltage area
  },
} satisfies ChartConfig;

// --------------------------- Available Time Ranges ---------------------------
const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

// --------------------------- VoltageChart Component ---------------------------
export const VoltageChart = () => {
  // --------------------------- State ---------------------------
  const {token} = useAuth();
  const [data, setData] = React.useState<VoltageDataPoint[]>([]); // chart data
  const [range, setRange] = React.useState("day");                // currently selected time range
  const [deviceId, setDeviceId] = React.useState<number | null>(null); // active device ID
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;      // API base URL from env

  // --------------------------- Fetch Active Device ---------------------------
  React.useEffect(() => {
    const fetchActiveDevice = async () => {
      try {
    // get auth token
        const res = await fetch(`${API_BASE_URL}/api/device/active`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch active device");
        const body = await res.json();
        setDeviceId(body.deviceId); // set active device ID
      } catch (err) {
        console.error(err); // log any errors
      }
    };
    fetchActiveDevice();
  }, [API_BASE_URL]);

  // --------------------------- Fetch Historical Voltage Data ---------------------------
  useEffect(() => {
    if (!deviceId) return; // do nothing if no device selected

    const fetchHistoricalData = async () => {
      try {
 
        const res = await fetch(
          `${API_BASE_URL}/api/voltage/history?range=${range}&deviceId=${deviceId}`,
          {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch voltage history");

        const body: VoltageDataPoint[] = await res.json();

        // Format timestamps for the chart X-axis
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

  // --------------------------- render ---------------------------
  return (
    <Card className="p-4">
      {/* --------------------------- card header --------------------------- */}
      <CardBody className="flex z-10 flex-col items-stretch !p-0 sm:flex-row">
        <div className="flex flex-1 items-center justify-start h-full gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          {/* battery i
          
          con */}
          <Kbd className="p-2 mr-3">
            <BatteryFull size={18} strokeWidth={1.7} />
          </Kbd>
          <h1 className="text-xl font-light">Battery Voltage</h1>
        </div>

        {/* --------------------------- range dropdown --------------------------- */}
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
                setRange(selected); // update selected time range
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

      {/* --------------------------- Voltage Chart --------------------------- */}
      <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
        <AreaChart data={data} margin={{ left: 12, right: 12 }}>
          {/* gradient for the area fill */}
          <defs>
            <linearGradient id="fillVoltage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-voltage)" stopOpacity={1} />
              <stop offset="95%" stopColor="var(--color-voltage)" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          {/* chart grid and axes */}
          <CartesianGrid vertical={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `${value.toFixed(1)}V`} // append "V" to Y-axis
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32} // spacing between x-axis labels
          />

          {/* custom tooltip */}
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[150px]"
                nameKey="voltage"
                labelFormatter={(value: any) => `${value} V`}
              />
            }
          />

          {/* area for voltage data */}
          <Area
            dataKey="voltage"
            type="monotone"
            fill="url(#fillVoltage)"
            stroke="var(--color-voltage)"
            strokeWidth={2}
            isAnimationActive={true} // smooth animation
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
};
