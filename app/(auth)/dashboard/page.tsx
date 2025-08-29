"use client";

import { useEffect } from "react";
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

import { ThemeSwitch } from "@/components/theme-switch";
import SearchForm from "@/components/SearchForm";
import DashboardContent from "./DashboardContent";
import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login"); // redirect to login page
    }
  }, [router]);

  // You can optionally show a "loading" screen until redirect check is done
  if (!isAuthenticated()) {
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
                      <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
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

          <div className="flex flex-col p-6 mt-5 gap-6">
            <h1 className="text-muted-foreground text-2xl">Loading...</h1>
            <Card className="w-full  h-96">
              <CardBody className="flex flex-col  gap-2 p-4">
                <Skeleton className="rounded-lg dark:bg-neutral-900 shadow-md bg-neutral-100">
                  <div className="h-28 rounded-lg " />
                </Skeleton>
                <div className="space-y-3">
                  <Skeleton className="w-3/5 rounded-lg bg-neutral-100 dark:bg-neutral-900 shadow-md ">
                    <div className="h-12 w-3/5 rounded-lg  bg-neutral-100" />
                  </Skeleton>
                  <Skeleton className="w-4/5   bg-neutral-100 dark:bg-neutral-900 shadow-md rounded-lg">
                    <div className="h-12 w-4/5 rounded-lg bg-neutral-100" />
                  </Skeleton>
                  <Skeleton className="w-2/5   bg-neutral-100 dark:bg-neutral-900 shadow-md rounded-lg">
                    <div className="h-12 w-2/5 rounded-lg" />
                  </Skeleton>
                </div>
              </CardBody>
            </Card>

            <Card className="w-full">
               <CardBody className="flex flex-col gap-2 p-4">
                <Skeleton className="rounded-lg">
                  <div className="h-28 rounded-lg bg-default-300" />
                </Skeleton>
                <div className="space-y-3">
                  <Skeleton className="w-3/5 rounded-lg">
                    <div className="h-12 w-3/5 rounded-lg bg-default-200" />
                  </Skeleton>
                  <Skeleton className="w-4/5 rounded-lg">
                    <div className="h-12 w-4/5 rounded-lg bg-default-200" />
                  </Skeleton>
                  <Skeleton className="w-2/5 rounded-lg">
                    <div className="h-12 w-2/5 rounded-lg bg-default-300" />
                  </Skeleton>
                </div>
              </CardBody>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
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
                    <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
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

        <DashboardContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
