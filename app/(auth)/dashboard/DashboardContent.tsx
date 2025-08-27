"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const DashboardContent = () => {
  const [animateKey, setAnimateKey] = useState(0);
  const [deviceSelectionTrigger, setDeviceSelectionTrigger] =
    useState<number>(0);

  useEffect(() => {
    if (deviceSelectionTrigger === 0) return;
    setAnimateKey((prev) => prev + 1);
  }, [deviceSelectionTrigger]);

  return (
    <div className="gap-4 px-6 py-2">
      <div>
        <header className="flex items-start justify-between gap-2"></header>

        <motion.div
          key={animateKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className=""
        >
            
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
            </div>  
            <div className="bg-muted/50 aspect-video min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardContent;
