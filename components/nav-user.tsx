"use client";

import * as React from "react";
import { BadgeCheck, Bell, ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@heroui/skeleton";
import {
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { AppUser } from "@/types/AppUser";
import { getToken, logout } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [user, setUser] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      logout();
      router.push("/");
      router.refresh();
    } catch {
      logout();
      router.push("/");
    }
  };

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok)
          throw new Error(`Failed to fetch user: ${response.status}`);

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user:", err);
       
        router.push("/login");
      
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const getInitials = (username?: string) => {
    if (!username) return "..";
    return username.slice(0, 2).toUpperCase();
  };

  if (loading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="max-w-[300px] w-full flex items-center gap-3">
              <Skeleton className="flex rounded-full w-12 h-12" />
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Dropdown
          showArrow
          placement={isMobile ? "bottom" : "right-start"}
          classNames={{
            base: "before:bg-default-200",
            content:
              "py-1 px-1 border border-default-200 bg-linear-to-br from-white to-default-200 dark:from-default-50 dark:to-black",
          }}
        >
          <DropdownTrigger>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.username}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownTrigger>

          <DropdownMenu>
            {/* User Info as non-interactive DropdownItem */}
            <DropdownItem className="cursor-default">
              <div className="flex items-center gap-2 px-2 py-1">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm leading-tight">
                  <span className="truncate font-medium">{user.username}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownItem>

            <DropdownSection>
              <DropdownItem
                className="hover:border-gray-500 hover:borer-2 "
                startContent={<BadgeCheck className="mr-2 h-4 w-4" />}
                key={""}
                href="/settings"
              >
                Account
              </DropdownItem>
              <DropdownItem
                onPress={handleLogout}
                startContent={<LogOut className="mr-2 h-4 w-4" />}
                key={""}
              >
                Log out
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
