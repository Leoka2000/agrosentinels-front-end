import React from "react"
import { useBluetoothSensor } from "../../context/useBluetoothSensor"
import { TemperatureChart } from "./TemperatureChart"


const TemperatureWrapper = () => {
  const { status } = useBluetoothSensor()

  return (
    <div className="mb-2 w-full rounded-lg h-full mx-auto">
      <TemperatureChart  status={status} />
    </div>
  )
}

export default TemperatureWrapper 