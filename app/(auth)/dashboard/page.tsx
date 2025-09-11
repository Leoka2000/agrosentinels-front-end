"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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

import { ThemeSwitch } from "@/components/theme-switch";
import SearchForm from "@/components/SearchForm";
import DashboardContent from "./DashboardContent";
import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { AuthProvider } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <AuthProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 justify-between shrink-0 items-center gap-2">
            <div>
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
            </div>
            <div className="flex items-center mr-4 gap-2">
              <ThemeSwitch />
            </div>
          </header>

          <DashboardContent />
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
