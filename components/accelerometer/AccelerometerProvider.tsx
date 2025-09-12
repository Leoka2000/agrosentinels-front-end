import React from "react"
import { useBluetoothSensor } from "../../context/useBluetoothSensor"
import { AccelerometerChart } from "./AccelerometerChart"

const AccelerometerProvider = () => {

  return (
    <div className="mb-2 w-full rounded-lg h-full mx-auto">
      <AccelerometerChart />
    </div>
  )
}

export default AccelerometerProvider