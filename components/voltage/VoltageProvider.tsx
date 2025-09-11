import React from "react";
import { VoltageChart } from "./VoltageChart";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

const VoltageProvider = () => {
  const { status, voltageData } = useBluetoothSensor();
 

  return (
    <div className="mb-2 w-full rounded-lg h-full mx-auto">
      <VoltageChart
  voltage={voltageData?.voltage != null ? voltageData.voltage.toFixed(1) : null}
        timestamp={voltageData?.timestamp ?? null}
        status={status}
      />
    </div>
  );
};

export default VoltageProvider;