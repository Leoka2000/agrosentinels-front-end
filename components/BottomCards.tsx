import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TemperatureCard } from "./temperature/TemperatureCard";
import { VoltageCard } from "./voltage/VoltageCard";
import { TimestampCard } from "./TimestampCard";
import { AlertCard } from "./AlertCard";

export function BottomCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 py-4 lg:grid-cols-4 gap-4">
      <TemperatureCard />

      <VoltageCard />

      <TimestampCard />

      <AlertCard />
    </div>
  );
}
