'use client';
import Link from 'next/link';
import { Bell, Menu, Moon, Sun, CheckCheck, type LucideIcon, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Notification, NOTIFICATION_ICONS } from '@/lib/types';


const navLinks = [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard' },
    { id: 'erp', href: '/erp', label: 'ERP' },
    { id: 'crm', href: '/crm', label: 'CRM' },
    { id: 'hr', href: '/hr', label: 'RH' },
    { id: 'rpa', href: '/rpa', label: 'RPA' },
    { id: 'logistics', href: '/logistics', label: 'Logística' },
    { id: 'finance', href: '/finance', label: 'Estados Financieros' },
    { id: 'inventory-control', href: '/inventory-control', label: 'Conteo Físico' },
    { id: 'budgets', href: '/budgets', label: 'Presupuestos' },
    { id: 'lims', href: '/lims', label: 'LIMS' },
    { id: 'projects', href: '#', label: 'Proyectos' },
    { id: 'blockchain', href: '#', label: 'Blockchain' },
    { id: 'comms', href: '#', label: 'Comunicación' },
    { id: 'reports-docs', href: '/documents', label: 'Reportes' },
    { id: 'export', href: '/export', label: 'Exportar' },
    { id: 'settings', href: '#', label: 'Ajustes' },
];

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = NOTIFICATION_ICONS[notification.iconName] || Bell;
  return (
    <DropdownMenuItem asChild>
      <Link href={notification.link} className={cn("gap-3", !notification.isRead && "bg-primary/5")}>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="text-xs text-muted-foreground">{notification.description}</p>
          <p className="text-xs text-muted-foreground/80">{formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: es })}</p>
        </div>
      </Link>
    </DropdownMenuItem>
  );
}

export function Header() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  const handleMarkAllAsRead = async () => {
    if (!user || !notifications || unreadCount === 0) return;
    const batch = writeBatch(firestore);
    notifications.forEach(notification => {
        if (!notification.isRead) {
            const docRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
            batch.update(docRef, { isRead: true });
        }
    });
    await batch.commit();
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '#') {
      return false;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push('/login');
    });
  };

  const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return 'AG';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  const showHeader = pathname !== '/login';

  if (!showHeader) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex h-20 items-center justify-between gap-4 border-b-2 border-green-500/30 bg-card px-4 md:px-6">
       <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <Logo />
        </Link>
      </div>

      <nav className="hidden flex-grow justify-center md:flex">
        <div className="flex items-center gap-2 text-xs lg:gap-2">
          {navLinks.map(link => (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                'transition-colors hover:text-foreground px-2 py-1.5 rounded-md',
                isActive(link.href)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className='md:hidden'>
        <Sheet>
            <SheetTrigger asChild>
                <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle><span className='sr-only'>Navegación Principal</span></SheetTitle>
                </SheetHeader>
                <nav className="grid gap-6 text-lg font-medium">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                        <Logo />
                    </Link>
                    {navLinks.map(link => (
                        <Link
                            key={link.id}
                            href={link.href}
                            className={cn(
                            'transition-colors hover:text-foreground',
                                isActive(link.href)
                                ? 'text-foreground font-semibold'
                                : 'text-muted-foreground'
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
      </div>
        
      <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute top-0 right-0 h-4 w-4 justify-center p-1 text-xs" variant="destructive">
                            {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={handleMarkAllAsRead}><CheckCheck className="mr-1 h-3 w-3"/>Marcar como leídas</Button>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading && (
                    <DropdownMenuItem disabled>
                         <div className="flex items-center gap-3 w-full">
                            <Skeleton className="h-4 w-4" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-3 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    </DropdownMenuItem>
                )}
                {notifications && notifications.length > 0 ? (
                    notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                ) : (
                    !isLoading && <DropdownMenuItem disabled>No tienes notificaciones</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Claro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Oscuro
              </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setTheme("sunrise")}>
                Amanecer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                <Avatar className='h-8 w-8'>
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} data-ai-hint="person face" />
                    <AvatarFallback className="bg-transparent font-semibold">{getAvatarFallback(user?.displayName)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bienvenido, {user?.displayName || 'Usuario'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Ajustes</DropdownMenuItem>
                <DropdownMenuItem>Soporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
    </header>
  );
}
