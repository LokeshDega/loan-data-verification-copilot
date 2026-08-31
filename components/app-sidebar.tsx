"use client"

import * as React from "react"
import {
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconHistory,
  IconReport,
  IconSettings,
  IconUsers,
  IconWaveSine,
  IconCheckbox,
  IconChevronsLeft,
  IconChevronsRight,
  IconFileText,
  IconAlertTriangle
} from "@tabler/icons-react"

import { useRole } from "@/context/RoleContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/ui/sidebar'
import { NavUser } from '@/components/nav-user'
import { NavMain } from '@/components/nav-main'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentRole, currentUser } = useRole();

  // Dynamically compute menu items based on the active simulation role
  const getNavItems = () => {
    switch (currentRole) {
      case 'OPERATOR':
        return [
          {
            title: "Data Ingestion Console",
            url: "/upload",
            icon: IconDatabase,
          },
          {
            title: "Upload History",
            url: "/history",
            icon: IconHistory,
          },
          {
            title: "Synthetic Test Data",
            url: "/synthetic",
            icon: IconFileText,
          }
        ];
      case 'REVIEWER':
        return [
          {
            title: "Exception Queue",
            url: "/exceptions",
            icon: IconAlertTriangle,
          },
          {
            title: "AI Suggestion Panel",
            url: "/ai-panel",
            icon: IconFileAi,
          },
          {
            title: "Recent Review Decisions",
            url: "/decisions",
            icon: IconHistory,
          }
        ];
      case 'CONSUMER':
        return [
          {
            title: "Verified Loan Records",
            url: "/verified",
            icon: IconCheckbox,
          },
          {
            title: "Data Quality Summary",
            url: "/summary",
            icon: IconReport,
          },
          {
            title: "Cryptographic Audit Trail",
            url: "/audits",
            icon: IconWaveSine,
          }
        ];
    }
  };

  const { state, toggleSidebar } = useSidebar();
  const navItems = getNavItems();

  return (
    <Sidebar collapsible="icon" {...props} className="bg-sidebar border-r border-border">
      <SidebarHeader className="border-b border-border py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {state === "expanded" ? (
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <IconWaveSine className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold leading-none text-foreground">Intain Copilot</span>
                    <span className="text-[10px] text-muted-foreground mt-1">FinTech Challenge 2026</span>
                  </div>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <IconChevronsLeft className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <button
                  onClick={toggleSidebar}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition cursor-pointer"
                  title="Expand Sidebar"
                >
                  <IconWaveSine className="h-5 w-5 animate-pulse" />
                </button>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {state === "expanded" && (
          <div className="px-3 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5">
              {currentRole} WORKSPACE
            </p>
          </div>
        )}
        <NavMain items={navItems} />
      </SidebarContent>

      {/* Sidebar Footer removed in favor of top-header profile */}
    </Sidebar>
  )
}
