"use client"

import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/ui/sidebar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const { state } = useSidebar()
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title} 
                  className={`duration-150 h-10.5 ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  <a href={item.url} className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm w-full h-full">
                    {item.icon && (
                      <item.icon 
                        className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} 
                      />
                    )}
                    {state === "expanded" && (
                      <span className={`font-semibold animate-in fade-in duration-200 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {item.title}
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
