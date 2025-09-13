"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card as HeroCard } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { useBluetoothDevice } from "@/context/BluetoothDeviceContext";

const DashboardView: React.FC = () => {
  const { isLayoutLoading } = useBluetoothDevice();

  if (!isLayoutLoading) return null; // only show skeletons during loading

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="skeleton-dashboard"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          {/* Header Skeleton */}
          <div className="flex justify-center mb-5 flex-col">
            <Skeleton className="h-8 w-1/3 rounded-lg" />
            <Skeleton className="h-4 w-2/3 mt-2 rounded-lg" />
          </div>

          {/* Pagination Skeleton */}
          <div className="flex justify-baseline gap-1 mb-7">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-lg" />
            ))}
          </div>

          {/* Top Cards */}
          <div className="grid auto-rows-min lg:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <HeroCard
                key={i}
                className="w-full gap-2 relative h-[11.5rem] p-6 pt-7"
              >
                <Skeleton className="h-10 w-3/5 rounded-lg" />
                <Skeleton className="h-4 w-3/5 rounded-lg" />
                <Skeleton className="h-4 w-4/5 rounded-lg" />
                <Skeleton className="h-4 w-2/5 rounded-lg" />
                <Skeleton className="p-4.5 absolute top-4.5 right-4.5 rounded-lg" />
              </HeroCard>
            ))}
          </div>

          {/* Bottom Cards */}
          <div className="grid auto-rows-min lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <HeroCard key={i} className="w-full gap-2 h-[10rem] p-6 pt-7">
                <Skeleton className="h-10 w-3/5 rounded-lg" />
                <Skeleton className="h-4 w-3/5 rounded-lg" />
                <Skeleton className="h-4 w-4/5 rounded-lg" />
                <Skeleton className="h-4 w-2/5 rounded-lg" />
                <Skeleton className="p-4.5 absolute top-4.5 right-4.5 rounded-lg" />
              </HeroCard>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-1 gap-6">
            {[...Array(2)].map((_, i) => (
              <HeroCard key={i} className="px-10 py-18 space-y-4">
                <Skeleton className="h-6 w-1/3 rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </HeroCard>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DashboardView;
