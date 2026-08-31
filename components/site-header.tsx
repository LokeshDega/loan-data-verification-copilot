"use client";

import { useRouter } from 'next/navigation';
import { useRole, UserRole } from '@/context/RoleContext';
import { IconShield, IconChevronDown } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';

export function SiteHeader() {
  const { currentRole, currentUser, setRole, usersList } = useRole();
  const router = useRouter();

  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-2 border-b border-border bg-card/60 backdrop-blur-md px-[26px] py-[10px] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height]">
      <div className="flex w-full items-center gap-1 lg:gap-2">
        
        <div className="flex items-center gap-2">
          <IconShield className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Loan Data Verification Copilot
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black border border-neutral-800 px-2.5 py-1.5 rounded-lg text-white">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Simulation Role:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="bg-black text-white text-xs font-semibold focus:outline-hidden cursor-pointer flex items-center gap-1 select-none">
                  {currentRole} ({currentUser.name.split(' ')[0]})
                  <IconChevronDown className="h-3 w-3 text-neutral-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black border border-neutral-800 text-white rounded-lg p-1 shadow-xl w-44">
                {usersList.map((user) => (
                  <DropdownMenuItem
                    key={user.role}
                    onClick={() => {
                      setRole(user.role as UserRole);
                      const defaultPath = user.role === 'OPERATOR' 
                        ? '/upload' 
                        : user.role === 'REVIEWER' 
                        ? '/exceptions' 
                        : '/verified';
                      router.push(defaultPath);
                    }}
                    className={`text-xs px-2.5 py-1.5 my-[3px] rounded-md cursor-pointer hover:bg-neutral-800 text-white flex items-center justify-between outline-hidden focus:bg-neutral-800 ${currentRole === user.role ? 'bg-neutral-800/80 font-bold' : ''}`}
                  >
                    {user.role} ({user.name.split(' ')[0]})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm border-l border-border pl-4">
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-xs leading-none text-foreground">{currentUser.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono leading-none mt-1">@{currentUser.username}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
