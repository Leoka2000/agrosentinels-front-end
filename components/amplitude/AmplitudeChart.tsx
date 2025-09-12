"use client";

import React, { useEffect } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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



interface AmplitudeDataPoint {
  ampl1: number;
  ampl2: number;
  ampl3: number;
  ampl4: number;
  timestamp: string;
  date?: string;
}

const chartConfig = {
  ampl1: { label: "Ampl 1", color: "#f43f5e" }, // red
  ampl2: { label: "Ampl 2", color: "#3b82f6" }, // blue
  ampl3: { label: "Ampl 3", color: "#10b981" }, // green
  ampl4: { label: "Ampl 4", color: "#f59e0b" }, // yellow
} satisfies ChartConfig;

const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

export const AmplitudeChart = () => {
  const [data, setData] = React.useState<AmplitudeDataPoint[]>([]);
  const [range, setRange] = React.useState("day");
  const [deviceId, setDeviceId] = React.useState<number | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const statusColorClass =
    status === "Disconnected"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-300";

  // Fetch active device
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

  // Fetch amplitude history
  useEffect(() => {
    if (!deviceId) return;

    const fetchHistoricalData = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE_URL}/api/amplitude/history?range=${range}&deviceId=${deviceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch amplitude history");
        const body: AmplitudeDataPoint[] = await res.json();

        const formattedData = body.map((point) => ({
          ...point,
          date: new Date(Number(point.timestamp) * 1000).toISOString(),
        }));

        console.log("Formatted Amplitude Data:", formattedData);
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
          <h1 className="2xl font-bold">Amplitude</h1>
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
        <LineChart
          accessibilityLayer
          data={data}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              });
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={["auto", "auto"]}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[220px]"
                nameKey="amplitude"
                labelFormatter={(value: any) =>
                  new Date(value).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
            }
          />
          <Line
            dataKey="ampl1"
            type="monotone"
            stroke="var(--color-ampl1)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="ampl2"
            type="monotone"
            stroke="var(--color-ampl2)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="ampl3"
            type="monotone"
            stroke="var(--color-ampl3)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="ampl4"
            type="monotone"
            stroke="var(--color-ampl4)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  );
};
