"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { 
    Box,
    ShoppingCart,
    Users,
    Receipt,
    Truck,
    Wrench,
    LineChart,
    Landmark,
    Package,
    CreditCard,
    TrendingUp,
    Bot,
    Map,
    Car,
    CheckCircle,
    DollarSign,
    type LucideIcon 
} from "lucide-react"

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
    CreditCard,
    TrendingUp,
    Bot,
    Map,
    Car,
    CheckCircle,
    DollarSign,
};

export type SidebarNavItem = {
    href: string
    title: string
    iconName: keyof typeof icons
};

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "flex flex-col space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const Icon = icons[item.iconName];
        return (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                pathname === item.href
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "hover:bg-transparent hover:underline",
                "justify-start gap-2"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.title}
            </Link>
        )
    })}
    </nav>
  )
}

    