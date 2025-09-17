"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@heroui/toast";
import { BluetoothSensorProvider } from "../context/useBluetoothSensor";
import { BluetoothDeviceProvider } from "@/context/BluetoothDeviceContext";
import { AuthProvider } from "@/context/AuthContext";
import { GlobalLoadingProvider } from "@/context/GlobalLoadingContext";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <GlobalLoadingProvider>
      <AuthProvider>
        <HeroUIProvider navigate={router.push}>
          <BluetoothDeviceProvider>
            <BluetoothSensorProvider>
              <ToastProvider placement="top-right" toastOffset={120} />
              <NextThemesProvider {...themeProps}>
                {children}
              </NextThemesProvider>
            </BluetoothSensorProvider>
          </BluetoothDeviceProvider>
        </HeroUIProvider>
      </AuthProvider>
    </GlobalLoadingProvider>
  );
}
