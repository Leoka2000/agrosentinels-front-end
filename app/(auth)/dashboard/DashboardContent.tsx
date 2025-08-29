"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DeviceTabs from "@/components/DeviceTabs";

const DashboardContent = () => {
  return (
    <div className="gap-4 px-6 py-2">
      <div>
        <header className="flex items-start justify-between gap-2"></header>

        <div className="flex justify-center pl-1 mb-5 flex-col">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground text-md">
            Visualize your device's health and live metrics
          </p>
        </div>
        <DeviceTabs />
      </div>
    </div>
  );
};

export default DashboardContent;
