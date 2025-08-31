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

  const unixHex = tsHex.match(/../g)!.reverse().join(""); // reverse for little endian
  return parseInt(unixHex, 16); // already in seconds
}

// Parse battery voltage (bytes 26–27 = chars 52–56)
export function parseBatteryVoltageHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;

  const batteryHex = cleanHex.slice(52, 56); // 2 bytes
  const batteryRaw = parseInt(batteryHex.match(/../g)!.reverse().join(""), 16);

  return batteryRaw / 1000; // return in Volts, e.g. 3.485
}