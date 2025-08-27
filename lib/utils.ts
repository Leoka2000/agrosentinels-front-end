import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function setToken(token: string) {
  localStorage.setItem("token", token)
}

export function getToken() {
  return localStorage.getItem("token")
}

export function isAuthenticated() {
  return !!getToken()
}

export function logout() {
  localStorage.removeItem("token")
}


export function parseAccelerometerHexData(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString
  const timestamp = parseInt(cleanHex.slice(0, 8), 16)
  const x = parseInt(cleanHex.slice(12, 16), 16) << 16 >> 16
  const y = parseInt(cleanHex.slice(16, 20), 16) << 16 >> 16
  const z = parseInt(cleanHex.slice(20, 24), 16) << 16 >> 16
  return { timestamp, x, y, z }
}


export function parseTemperatureHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const timestampHex = cleanHex.slice(0, 8);
  const temperatureHex = cleanHex.slice(8, 12);

  const readableTimestamp = parseInt(timestampHex, 16);
  const readableTemperature = parseInt(temperatureHex, 16) / 10;

  return {
    timestamp: readableTimestamp,
    temperature: readableTemperature,
  };
}

export function parseAllSensorData(hexString: string) {
  return {
    temperature: parseTemperatureHex(hexString),
    accelerometer: parseAccelerometerHexData(hexString),
  }
}


export function parseBatteryVoltageHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const batteryHex = cleanHex.slice(56, 60);
  const batteryRaw = parseInt(batteryHex, 16);
  return batteryRaw / 1000; // Return just the voltage number (e.g., 3.485)
}


export function formatElapsedTime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ") + " ago";
}