
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    Package,
    ShoppingCart,
    Users,
    Receipt,
    Truck,
    Wrench,
    LineChart,
    Landmark,
    Box,
    type LucideIcon 
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip"

const icons: { [key: string]: LucideIcon } = {
    Package,
    Box,
    ShoppingCart,
    Users,
    Receipt,
    Truck,
    Landmark,
    LineChart,
    Wrench,
};

const sidebarNavItems = [
    { title: 'Productos', href: '/erp/products', iconName: 'Package' },
    { title: 'Inventario', href: '/erp/inventory', iconName: 'Box' },
    { title: 'Ventas', href: '/erp/sales', iconName: 'ShoppingCart' },
    { title: 'Proveedores', href: '/erp/suppliers', iconName: 'Users' },
    { title: 'Cotizaciones', href: '/erp/quotations', iconName: 'Receipt' },
    { title: 'Compras', href: '/erp/purchases', iconName: 'Truck' },
    { title: 'Activos Fijos', href: '/erp/fixed-assets', iconName: 'Landmark' },
    { title: 'Abonos', href: '/erp/payments', iconName: 'Landmark' },
    { title: 'Reportes', href: '/erp/reports', iconName: 'LineChart' },
    { title: 'Mantenimiento', href: '/erp/maintenance', iconName: 'Wrench' },
];

export function ErpSidebarNav() {
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
            <Link href="/" className={cn("flex items-center gap-2 font-semibold", isCollapsed && "w-full justify-center")}>
              <Image src="/logo-agro.png" alt="Agronare ERP" width={40} height={40} data-ai-hint="logo" />
              <span className={cn("font-bold", isCollapsed && "hidden")}>ERP</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
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
          </div>
          {!isCollapsed && (
            <div className="mt-auto p-4 text-center text-xs text-muted-foreground border-t">
              <p>© AGRONARE - 2025</p>
            </div>
          )}
      </div>
    </TooltipProvider>
  )
}
