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


export function parseTimestampHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const tsHex = cleanHex.slice(0, 8); // first 4 bytes (8 hex chars)

  // MCU sends big-endian (MSB first), so do NOT reverse
  const unixTimestamp = parseInt(tsHex, 16);

  // Optional sanity check: if timestamp > current time + 1 year, discard
  const now = Math.floor(Date.now() / 1000);
  if (unixTimestamp > now + 365 * 24 * 3600 || unixTimestamp < 1600000000) {
    console.warn("⚠️ Timestamp seems invalid, using current time instead");
    return now;
  }

  return unixTimestamp;
}

// Battery voltage parsing
export function parseBatteryVoltageHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

  const batteryHex = cleanHex.slice(-4); // last 2 bytes = 4 hex chars
  const batteryRaw = parseInt(batteryHex, 16); // big-endian, no reverse

  return batteryRaw / 1000; // volts
}

export function parseTemperatureHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

  // Characters 9–12 → indexes 8..12 (4 hex chars = 2 bytes)
  const tempHex = cleanHex.slice(8, 12);
  if (tempHex.length !== 4) {
    console.warn("⚠️ Temp hex length unexpected:", tempHex);
    return NaN;
  }

  // Parse as signed 16-bit (big-endian)
  let raw = parseInt(tempHex, 16);
  if ((raw & 0x8000) !== 0) raw = raw - 0x10000;

  // Sensor scale: tenths of a degree Celsius
  const tempC = raw / 10;

  // Optional sanity check/logs
  if (tempC < -40 || tempC > 125) {
    console.warn(`⚠️ Temperature out of range (${tempC} °C) from hex ${tempHex}`);
  } else {
    console.log(`🌡️ Temp raw=0x${tempHex} -> ${tempC} °C`);
  }

  return tempC;
}


export function parseAccelerometerHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

  if (cleanHex.length < 24) {
    console.warn("⚠️ Hex string too short for accelerometer:", cleanHex);
    return { x: NaN, y: NaN, z: NaN };
  }

  // Characters 13-16: X, 17-20: Y, 21-24: Z (indexes 12..16, 16..20, 20..24)
  const xHex = cleanHex.slice(12, 16);
  const yHex = cleanHex.slice(16, 20);
  const zHex = cleanHex.slice(20, 24);

  const x = parseInt(xHex, 16);
  const y = parseInt(yHex, 16);
  const z = parseInt(zHex, 16);

  console.log(`📏 Accelerometer values -> X: ${x}, Y: ${y}, Z: ${z}`);

  return { x, y, z };
}