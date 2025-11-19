'use client';
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, CreditCard, TrendingUp, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../ui/tooltip"

const icons: { [key: string]: LucideIcon } = {
    Users,
    CreditCard,
    TrendingUp,
};

const sidebarNavItems = [
  {
    title: 'Clientes',
    href: '/crm/clients',
    iconName: 'Users',
  },
  {
    title: 'Créditos y Abonos',
    href: '/crm/credits',
    iconName: 'CreditCard',
  },
  {
    title: 'Pipeline de Ventas',
    href: '/crm/pipeline',
    iconName: 'TrendingUp',
  },
];

export function CrmSidebarNav() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "hidden md:flex flex-col border-r bg-background transition-all duration-300 neon-border",
          isCollapsed ? "w-20" : "w-64"
        )}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
          <div className="flex h-16 items-center justify-center border-b px-4 lg:px-6 relative">
            <Image
                src="/logo-crm.png"
                alt="CRM Logo"
                width={40}
                height={40}
                data-ai-hint="logo"
                className={cn(!isCollapsed && "mr-2")}
            />
             {!isCollapsed && <span className="font-bold text-lg">CRM</span>}
          </div>
          <nav className="flex-1 p-2 space-y-1">
              {sidebarNavItems.map((item) => {
                const Icon = icons[item.iconName];
                const isActive = pathname.startsWith(item.href);
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                          isActive && "bg-primary/10 text-primary font-semibold",
                          isCollapsed && "justify-center"
                        )}
                      >
                        {Icon && <Icon className="h-5 w-5" />}
                        <span className={cn("truncate", isCollapsed && "hidden")}>{item.title}</span>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
          </nav>
          {!isCollapsed && (
            <div className="p-4 border-t text-xs text-muted-foreground text-center">
                <p>© AGRONARE - 2025</p>
            </div>
          )}
      </div>
    </TooltipProvider>
  )
}
