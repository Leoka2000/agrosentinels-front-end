import React from "react"
import { useBluetoothSensor } from "../../context/useBluetoothSensor"
import { TemperatureChart } from "./TemperatureChart"


const TemperatureWrapper = () => {


  return (
    <div className="mb-2 w-full rounded-lg h-full mx-auto">
      <TemperatureChart   />
    </div>
  )
}

export default TemperatureWrapper 