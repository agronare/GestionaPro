'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Bot, PlusCircle, CheckCircle2, XCircle, Play, Pause, AlertTriangle, MoreVertical, Search, Pencil, Trash2, Clock, Zap, MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { AddRpaBotDialog } from '@/components/rpa/add-rpa-bot-dialog';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export type BotProcess = {
  id: string;
  name: string;
  description: string;
  status: 'Activo' | 'Inactivo' | 'Error';
  lastRun: string;
  nextRun: string;
  trigger?: 'scheduled' | 'manual' | 'webhook';
  frequency?: string;
};

const initialBots: BotProcess[] = [
  { id: 'RPA001', name: 'Conciliación Bancaria Automática', description: 'Cruza los movimientos del banco con los registros contables.', status: 'Activo', lastRun: '08/11/2025 04:00', nextRun: '09/11/2025 04:00', trigger: 'scheduled', frequency: 'Cada 24 horas' },
  { id: 'RPA002', name: 'Generador de Reportes de Ventas', description: 'Envía el reporte de ventas diario al equipo gerencial.', status: 'Activo', lastRun: '08/11/2025 08:00', nextRun: '09/11/2025 08:00', trigger: 'scheduled', frequency: 'Diario a las 8am' },
  { id: 'RPA003', name: 'Recordatorio de Cobranza', description: 'Envía correos de recordatorio para facturas vencidas.', status: 'Inactivo', lastRun: '01/11/2025 10:00', nextRun: 'N/A', trigger: 'manual' },
  { id: 'RPA004', name: 'Sincronización de Inventario', description: 'Falla al conectar con el sistema de almacén externo.', status: 'Error', lastRun: '07/11/2025 12:00', nextRun: 'Reintento en 1h', trigger: 'webhook' },
];


export default function RpaPage() {
  const [bots, setBots] = useState<BotProcess[]>(initialBots);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBot, setEditingBot] = useState<BotProcess | undefined>(undefined);

  const handleAddOrEditBot = (data: any) => {
    if (editingBot) {
      setBots(bots.map(bot => 
        bot.id === editingBot.id 
          ? { 
              ...bot, 
              name: data.name,
              description: data.description,
              trigger: data.trigger,
              frequency: data.frequency,
              nextRun: data.trigger === 'scheduled' ? (data.frequency || bot.nextRun) : 'Manual',
            } 
          : bot
      ));
    } else {
      const newBot: BotProcess = {
        id: `RPA${Date.now()}`,
        name: data.name,
        description: data.description,
        status: 'Inactivo',
        lastRun: 'N/A',
        nextRun: data.trigger === 'scheduled' ? data.frequency : 'Manual',
        trigger: data.trigger,
        frequency: data.frequency,
      };
      setBots(prev => [newBot, ...prev]);
    }
  };

  const handleOpenDialog = (open: boolean) => {
    if (!open) {
        setEditingBot(undefined);
    }
    setIsDialogOpen(open);
  }

  const handleEditBot = (bot: BotProcess) => {
    setEditingBot(bot);
    setIsDialogOpen(true);
  };

  const toggleBotStatus = (botId: string) => {
    setBots(bots.map(bot => {
      if (bot.id === botId && bot.status !== 'Error') {
        return { ...bot, status: bot.status === 'Activo' ? 'Inactivo' : 'Activo' };
      }
      return bot;
    }));
  };

  const handleDeleteBot = (botId: string) => {
    setBots(bots.filter(bot => bot.id !== botId));
  };
  
  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusCounts = bots.reduce((acc, bot) => {
    if (bot.status === 'Activo') acc.active++;
    else if (bot.status === 'Inactivo') acc.inactive++;
    else if (bot.status === 'Error') acc.error++;
    return acc;
  }, { active: 0, inactive: 0, error: 0 });

  const getStatusIndicator = (status: BotProcess['status']) => {
    switch (status) {
      case 'Activo':
        return { icon: Play, color: 'bg-green-100 text-green-700 border-green-300', label: 'Activo' };
      case 'Inactivo':
        return { icon: Pause, color: 'bg-gray-100 text-gray-600 border-gray-300', label: 'Inactivo' };
      case 'Error':
        return { icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-300', label: 'Error' };
    }
  };
  
  const getTriggerIndicator = (trigger?: BotProcess['trigger']) => {
     switch (trigger) {
      case 'scheduled':
        return { icon: Clock, label: 'Programado' };
      case 'webhook':
        return { icon: Zap, label: 'Webhook' };
      case 'manual':
      default:
        return { icon: MousePointerClick, label: 'Manual' };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
              Centro de Automatización RPA
            </h1>
            <p className="text-muted-foreground">
              Gestiona, programa y supervisa tus bots automáticos.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div>
                    <span className="font-semibold">{statusCounts.active}</span>
                    <span className="text-muted-foreground ml-1">Activos</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-gray-400" />
                <div>
                    <span className="font-semibold">{statusCounts.inactive}</span>
                    <span className="text-muted-foreground ml-1">Inactivos</span>
                </div>
            </div>
             <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <div>
                    <span className="font-semibold">{statusCounts.error}</span>
                    <span className="text-muted-foreground ml-1">con Error</span>
                </div>
            </div>
        </div>
      </div>
      
       <div className='flex items-center justify-between'>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nombre o descripción..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Bot
            </Button>
      </div>

        {filteredBots.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredBots.map((bot) => {
                const status = getStatusIndicator(bot.status);
                const trigger = getTriggerIndicator(bot.trigger);
                return (
                <Card key={bot.id} className="flex flex-col">
                    <CardHeader>
                        <div className='flex justify-between items-start'>
                             <Badge variant={'outline'} className={cn('gap-1.5', status.color)}>
                                <status.icon className="h-3 w-3"/>
                                {status.label}
                            </Badge>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className='-mt-2 -mr-2'>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => toggleBotStatus(bot.id)} disabled={bot.status === 'Error'}>
                                        {bot.status === 'Activo' ? <><Pause className="mr-2 h-4 w-4"/> Pausar</> : <><Play className="mr-2 h-4 w-4"/> Activar</>}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Ver historial</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditBot(bot)}>
                                        <Pencil className="mr-2 h-4 w-4"/> Configurar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteBot(bot.id)}>
                                        <Trash2 className="mr-2 h-4 w-4"/> Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <CardTitle className='pt-2'>{bot.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className='text-sm text-muted-foreground'>{bot.description}</p>
                    </CardContent>
                    <CardFooter className='flex-col items-start gap-3 pt-4 border-t'>
                        <div className='flex items-center gap-1.5 text-muted-foreground text-sm'>
                            <trigger.icon className='h-4 w-4'/>
                            <span>{trigger.label}{bot.trigger === 'scheduled' && bot.frequency ? `: ${bot.frequency}` : ''}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Última ejecución: {bot.lastRun}</p>
                            <p>Próxima ejecución: {bot.nextRun}</p>
                        </div>
                    </CardFooter>
                </Card>
            )})}
        </div>
        ) : (
            <Card className="h-64 flex items-center justify-center border-dashed">
                <p className="text-muted-foreground">No se encontraron bots con ese criterio.</p>
            </Card>
        )}

      <AddRpaBotDialog
        isOpen={isDialogOpen}
        onOpenChange={handleOpenDialog}
        onAddBot={handleAddOrEditBot}
        editingBot={editingBot}
      />
    </div>
  );
}
