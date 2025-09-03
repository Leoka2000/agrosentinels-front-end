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

export function parseFrequencyHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

  if (cleanHex.length < 40) {
    console.warn("⚠️ Hex string too short for frequencies:", cleanHex);
    return { freq1: NaN, freq2: NaN, freq3: NaN, freq4: NaN };
  }

  // frequencies: bytes 12–19 (hex chars 24–39)
  const freq1Hex = cleanHex.slice(24, 28); // byte 12–13
  const freq2Hex = cleanHex.slice(28, 32); // byte 14–15
  const freq3Hex = cleanHex.slice(32, 36); // byte 16–17
  const freq4Hex = cleanHex.slice(36, 40); // byte 18–19

  const freq1 = parseInt(freq1Hex, 16); // uInt16, big-endian
  const freq2 = parseInt(freq2Hex, 16);
  const freq3 = parseInt(freq3Hex, 16);
  const freq4 = parseInt(freq4Hex, 16);

  // sanity check ---- frequencies should be non-negative and reasonable (e.g., < 20kHz)
  if (freq1 > 20000 || freq2 > 20000 || freq3 > 20000 || freq4 > 20000) {
    console.warn(`⚠️ Frequency out of range: ${freq1}, ${freq2}, ${freq3}, ${freq4} from hex ${freq1Hex},${freq2Hex},${freq3Hex},${freq4Hex}`);
  } else {
    console.log(`🎵 Frequencies -> F1: ${freq1} Hz, F2: ${freq2} Hz, F3: ${freq3} Hz, F4: ${freq4} Hz`);
  }

  return { freq1, freq2, freq3, freq4 };
}

export function parseAmplitudeHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

  if (cleanHex.length < 56) {
    console.warn("⚠️ Hex string too short for amplitudes:", cleanHex);
    return { ampl1: NaN, ampl2: NaN, ampl3: NaN, ampl4: NaN };
  }

  // amplitudes --- bytes 20–27 (hex chars 40–55)
  const ampl1Hex = cleanHex.slice(40, 44); // byte 20–21
  const ampl2Hex = cleanHex.slice(44, 48); // byte 22–23
  const ampl3Hex = cleanHex.slice(48, 52); // byte 24–25
  const ampl4Hex = cleanHex.slice(52, 56); // byte 26–27

  const ampl1 = parseInt(ampl1Hex, 16); // uInt16, big-endian
  const ampl2 = parseInt(ampl2Hex, 16);
  const ampl3 = parseInt(ampl3Hex, 16);
  const ampl4 = parseInt(ampl4Hex, 16);

  // sanity check hahahah --- amplitudes should be non-negative and reasonable (e.g., < 5000 mV)
  if (ampl1 > 5000 || ampl2 > 5000 || ampl3 > 5000 || ampl4 > 5000) {
    console.warn(`⚠️ Amplitude out of range: ${ampl1}, ${ampl2}, ${ampl3}, ${ampl4} from hex ${ampl1Hex},${ampl2Hex},${ampl3Hex},${ampl4Hex}`);
  } else {
    console.log(`📈 Amplitudes -> A1: ${ampl1} mV, A2: ${ampl2} mV, A3: ${ampl3} mV, A4: ${ampl4} mV`);
  }

  return { ampl1, ampl2, ampl3, ampl4 };
}