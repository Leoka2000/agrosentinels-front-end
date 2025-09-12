import React from "react";
import { VoltageChart } from "./VoltageChart";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

const VoltageProvider = () => {

 

  return (
    <div className="mb-2 w-full rounded-lg h-full mx-auto">
      <VoltageChart

      />
    </div>
  );
};

export default VoltageProvider;