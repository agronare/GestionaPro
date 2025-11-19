'use client';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Filter, User, FileText, CreditCard, PlusCircle, Trash2 } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Client } from '@/app/crm/clients/page';
import { cn } from '@/lib/utils';
import { VerifyClientQrDialog } from './verify-client-qr-dialog';
import { createNotification } from '@/services/notification-service';
import { useFirestore, useUser } from '@/firebase';


type AddClientDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddClient: (data: any) => void;
  editingClient?: Client;
};

const cropSchema = z.object({
  name: z.string().optional(),
  surface: z.coerce.number().optional(),
});

const clientSchema = z.object({
  commercialName: z.string().min(1, 'El nombre comercial es requerido.'),
  nickname: z.string().optional(),
  contactName: z.string().min(1, 'El nombre de contacto es requerido.'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email('Correo electrónico inválido.'),
  
  // Agricultural Data
  crops: z.array(cropSchema).optional(),
  manualMileage: z.coerce.number().optional(),
  
  // Credit
  enableCredit: z.boolean().default(false),
  creditLimit: z.coerce.number().optional(),

  // Fiscal Data
  rfc: z.string().min(12, 'RFC debe tener al menos 12 caracteres.'),
  legalName: z.string().optional(),
  fiscalRegime: z.string().optional(),
  cfdiUse: z.string().optional(),
  postalCode: z.string().optional(),
  street: z.string().optional(),
  extNumber: z.string().optional(),
  intNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  municipality: z.string().optional(),
  locality: z.string().optional(),
  state: z.string().optional(),
});


export function AddClientDialog({
  isOpen,
  onOpenChange,
  onAddClient,
  editingClient,
}: AddClientDialogProps) {
  const [hideAgricultural, setHideAgricultural] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [tempClientId, setTempClientId] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      commercialName: '',
      nickname: '',
      contactName: '',
      phone: '',
      mobile: '',
      email: '',
      crops: [{ name: '', surface: 0 }],
      manualMileage: 0,
      enableCredit: false,
      creditLimit: 0,
      rfc: '',
      legalName: '',
      fiscalRegime: '',
      cfdiUse: '',
      postalCode: '',
      street: '',
      extNumber: '',
      intNumber: '',
      neighborhood: '',
      municipality: '',
      locality: '',
      state: '',
    },
  });

  const { fields: cropFields, append: appendCrop, remove: removeCrop } = useFieldArray({
    control: form.control,
    name: "crops",
  });

  useEffect(() => {
    if (isOpen) {
        if (editingClient) {
          form.reset({
            ...form.getValues(), // keep unrelated fields
            commercialName: editingClient.name,
            rfc: editingClient.rfc,
            contactName: editingClient.contact,
            creditLimit: editingClient.creditLimit,
            enableCredit: editingClient.creditLimit > 0,
          });
          setTempClientId(editingClient.id);
        } else {
          const newId = `CLIENT-TEMP-${Date.now()}`;
          form.reset({
            commercialName: '',
            nickname: '',
            contactName: '',
            phone: '',
            mobile: '',
            email: '',
            crops: [{ name: '', surface: 0 }],
            manualMileage: 0,
            enableCredit: false,
            creditLimit: 0,
            rfc: '',
            legalName: '',
            fiscalRegime: '',
            cfdiUse: '',
            postalCode: '',
            street: '',
            extNumber: '',
            intNumber: '',
            neighborhood: '',
            municipality: '',
            locality: '',
            state: '',
          });
          setTempClientId(newId);
        }
    }
  }, [editingClient, form, isOpen]);
  
  const onSubmit = (data: z.infer<typeof clientSchema>) => {
    onAddClient(data);
    if (!editingClient && user) {
        if (!firestore) return;
        createNotification(firestore, user.uid, {
            title: 'Nuevo Cliente',
            description: `Se ha registrado el cliente: ${data.commercialName}`,
            link: '/crm/clients',
            iconName: 'Users',
        });
    }
    onOpenChange(false);
  };
  
  const creditEnabled = form.watch('enableCredit');

  const handleCreditSwitch = (checked: boolean) => {
    form.setValue('enableCredit', checked);
    if (checked) {
        setIsQrDialogOpen(true);
    }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle className='text-xl'>{editingClient ? 'Editar Cliente' : 'Nuevo cliente Agrícola'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[70vh] px-6">
                    <div className="space-y-6 py-4">
                        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4']} className="w-full">
                            <AccordionItem value="item-1" className='border-none'>
                                <AccordionTrigger className='font-semibold text-base py-2 hover:no-underline'><User className='mr-2 h-5 w-5 text-primary'/>Datos Generales y de Contacto</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="commercialName" render={({ field }) => (
                                             <FormItem><FormLabel>Nombre Comercial *</FormLabel><FormControl><Input placeholder="Ej. Agrícola San Miguel" {...field} /></FormControl><FormMessage /></FormItem>
                                         )} />
                                         <FormField control={form.control} name="nickname" render={({ field }) => (
                                             <FormItem><FormLabel>Apodo / Descripción</FormLabel><FormControl><Input placeholder="Ej. cliente frecuente de maíz" {...field} /></FormControl><FormMessage /></FormItem>
                                         )} />
                                     </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="contactName" render={({ field }) => (
                                             <FormItem><FormLabel>Nombre de Contacto *</FormLabel><FormControl><Input placeholder="Nombre completo del contacto" {...field} /></FormControl><FormMessage /></FormItem>
                                         )} />
                                         <FormField control={form.control} name="phone" render={({ field }) => (
                                             <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="(55) 1234-5678" {...field} /></FormControl><FormMessage /></FormItem>
                                         )} />
                                     </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="mobile" render={({ field }) => (
                                             <FormItem><FormLabel>Móvil</FormLabel><FormControl><Input placeholder="(55) 8765-4321" {...field} /></FormControl><FormMessage /></FormItem>
                                         )} />
                                         <FormField control={form.control} name="email" render={({ field }) => (
                                             <FormItem><FormLabel>Correo Electrónico *</FormLabel><FormControl><Input placeholder="contacto@ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                                         )} />
                                     </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-2" className='border-none'>
                                <AccordionTrigger className='font-semibold text-base py-2 hover:no-underline'>
                                    <div className='flex items-center'>
                                        <Filter className='mr-2 h-5 w-5 text-primary'/>Datos Agrícolas y Logísticos
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className='flex items-center gap-2 justify-end mb-4'>
                                        <label htmlFor="hide-agricultural" className='text-sm font-normal text-muted-foreground'>Ocultar datos agrícolas</label>
                                        <Switch id="hide-agricultural" checked={hideAgricultural} onCheckedChange={setHideAgricultural}/>
                                    </div>
                                    <div className={cn("space-y-4", hideAgricultural && 'hidden')}>
                                        {cropFields.map((field, index) => (
                                            <div key={field.id} className="flex items-end gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`crops.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem className='flex-1'>
                                                            <FormLabel>Cultivo {index > 0 ? index + 1 : 'Principal'}</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ej: Maíz, Frijol, Aguacate" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`crops.${index}.surface`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Superficie (ha)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="Ej: 15.5" {...field} className="w-28" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {index > 0 && (
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCrop(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                         <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => appendCrop({ name: '', surface: 0 })}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Cultivo
                                        </Button>
                                        <FormField
                                            control={form.control}
                                            name="manualMileage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kilometraje Manual (Ida y Vuelta)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Ej: 45" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-3" className='border-none'>
                                <AccordionTrigger className='font-semibold text-base py-2 hover:no-underline'><CreditCard className='mr-2 h-5 w-5 text-primary'/>Crédito y Verificación de Identidad</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <FormField control={form.control} name="enableCredit" render={({ field }) => (
                                        <FormItem className="flex items-center gap-4 rounded-lg border p-4">
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={handleCreditSwitch} />
                                            </FormControl>
                                            <div>
                                                <FormLabel className='text-base'>{field.value ? "Crédito activado" : "Crédito desactivado"}</FormLabel>
                                                <FormDescription>Activa esta opción si deseas asignar un límite de crédito a este cliente.</FormDescription>
                                            </div>
                                        </FormItem>
                                    )} />
                                    {creditEnabled && (
                                        <FormField control={form.control} name="creditLimit" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Límite de Crédito (MXN)</FormLabel>
                                                <FormControl><Input type="number" placeholder="50000" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    )}
                                     <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Nota</AlertTitle>
                                        <AlertDescription>
                                            La verificación de identidad con INE + selfie solo es requerida si se otorga crédito a este cliente. Puedes activarla en cualquier momento.
                                        </AlertDescription>
                                    </Alert>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-4" className='border-none'>
                                <AccordionTrigger className='font-semibold text-base py-2 hover:no-underline'><FileText className='mr-2 h-5 w-5 text_primary'/>Datos Fiscales</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="rfc" render={({ field }) => ( <FormItem><FormLabel>RFC</FormLabel><FormControl><Input placeholder="XAXX010101000" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        <FormField control={form.control} name="legalName" render={({ field }) => ( <FormItem><FormLabel>Razón Social</FormLabel><FormControl><Input placeholder="Nombre legal del cliente" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="fiscalRegime" render={({ field }) => ( 
                                            <FormItem>
                                                <FormLabel>Régimen Fiscal</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar régimen" /></SelectTrigger></FormControl><SelectContent><SelectItem value="601">General de Ley Personas Morales</SelectItem><SelectItem value="612">Persona Física con Actividades Empresariales y Profesionales</SelectItem><SelectItem value="621">Incorporación Fiscal</SelectItem></SelectContent></Select>
                                                <FormMessage />
                                            </FormItem> 
                                        )}/>
                                        <FormField control={form.control} name="cfdiUse" render={({ field }) => ( 
                                            <FormItem>
                                                <FormLabel>Uso de CFDI</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar uso" /></SelectTrigger></FormControl><SelectContent><SelectItem value="G01">Adquisición de mercancías</SelectItem><SelectItem value="G03">Gastos en general</SelectItem><SelectItem value="I08">Otra maquinaria y equipo</SelectItem></SelectContent></Select>
                                                <FormMessage />
                                            </FormItem> 
                                        )}/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="postalCode" render={({ field }) => ( <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input placeholder="12345" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        <FormField control={form.control} name="street" render={({ field }) => ( <FormItem><FormLabel>Calle</FormLabel><FormControl><Input placeholder="Calle principal" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="extNumber" render={({ field }) => ( <FormItem><FormLabel>No. Exterior</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        <FormField control={form.control} name="intNumber" render={({ field }) => ( <FormItem><FormLabel>No. Interior</FormLabel><FormControl><Input placeholder="A, B, Depto." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="neighborhood" render={({ field }) => ( <FormItem><FormLabel>Colonia</FormLabel><FormControl><Input placeholder="Nombre de la colonia" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        <FormField control={form.control} name="municipality" render={({ field }) => ( <FormItem><FormLabel>Municipio</FormLabel><FormControl><Input placeholder="Nombre del municipio" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="locality" render={({ field }) => ( <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input placeholder="Nombre de la localidad" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        <FormField control={form.control} name="state" render={({ field }) => ( <FormItem><FormLabel>Estado</FormLabel><FormControl><Input placeholder="Nombre del estado" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </ScrollArea>
                <DialogFooter className="px-6 pb-6 pt-2 border-t mt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit">Guardar cliente</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
    <VerifyClientQrDialog 
        isOpen={isQrDialogOpen}
        onOpenChange={setIsQrDialogOpen}
        clientId={tempClientId}
        clientName={form.getValues('commercialName')}
    />
    </>
  );
}
