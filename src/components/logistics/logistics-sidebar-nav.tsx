'use client';
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, Package, CheckCircle, Car, DollarSign, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../ui/tooltip"

const icons: { [key: string]: LucideIcon } = {
  Map,
  Package,
  CheckCircle,
  Car,
  DollarSign,
};

const sidebarNavItems = [
  { title: 'Planificador', href: '/logistics/planner', iconName: 'Map' },
  { title: 'Recolecciones', href: '/logistics/recolecciones', iconName: 'Package' },
  { title: 'Entregas', href: '/logistics/deliveries', iconName: 'CheckCircle' },
  { title: 'Flota', href: '/logistics/fleet', iconName: 'Car' },
  { title: 'Gastos', href: '/logistics/expenses', iconName: 'DollarSign' },
];

export function LogisticsSidebarNav() {
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
          <div className="p-4 flex flex-col items-center gap-2 border-b h-16 justify-center relative">
            <Image
                src="/logo-logistic.png"
                alt="Logistics Logo"
                width={60}
                height={60}
                data-ai-hint="logo"
                className={cn(!isCollapsed && "mr-2")}
            />
            {!isCollapsed && <span className="font-bold text-lg">Logística</span>}
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
  );
}
