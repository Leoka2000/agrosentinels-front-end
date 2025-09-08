"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {Spinner} from '@heroui/spinner'
import { ThemeSwitch } from "@/components/theme-switch";
import SearchForm from "@/components/SearchForm";
import ProfileContent from "./ProfileContent";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [animateKey, setAnimateKey] = useState(0);
  const [deviceSelectionTrigger, setDeviceSelectionTrigger] =
    useState<number>(0);

  useEffect(() => {
    if (deviceSelectionTrigger === 0) return;
    setAnimateKey((prev) => prev + 1);
  }, [deviceSelectionTrigger]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login"); // redirect to login page
    }
  }, [router]);

  // You can optionally show a "loading" screen until redirect check is done
  if (!isAuthenticated()) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner color="primary" label="Loading..." />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 justify-between shrink-0 items-center gap-2">
          <div>
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Profile Settings</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <div className="flex items-center mr-4 gap-2">
            <SearchForm />
            <ThemeSwitch />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 w-full px-4 pt-0">
          <motion.div
            key={animateKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className=""
          >
            <div className="flex justify-center pl-4 flex-col">
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-muted-foreground text-md">Manage your profile and account settings</p>
            </div>
            <ProfileContent />
          </motion.div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
