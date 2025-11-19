'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PlusCircle,
  Search,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { AddClientDialog } from '@/components/crm/add-client-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';

export type Client = {
  id: string;
  name: string;
  rfc: string;
  contact: string;
  creditLimit: number;
  status: 'Activo' | 'Inactivo';
  createdAt?: Timestamp;
};

export default function ClientsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const clientsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'clients');
  }, [firestore, user]);
  const { data: clients, isLoading: areClientsLoading } = useCollection<Client>(clientsCollection);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddClient = (newClientData: any) => {
    if (!firestore) return;
    const id = editingClient ? editingClient.id : `CLIENT-${Date.now()}`;
    const clientDocRef = doc(firestore, 'clients', id);
    const clientData: Omit<Client, 'id'> = {
      name: newClientData.commercialName,
      rfc: newClientData.rfc,
      contact: newClientData.contactName,
      creditLimit: newClientData.enableCredit ? newClientData.creditLimit : 0,
      status: 'Activo',
      createdAt: editingClient?.createdAt || Timestamp.now(),
    };
    
    setDocumentNonBlocking(clientDocRef, clientData, { merge: true });
    setEditingClient(undefined);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleDelete = (clientId: string) => {
    if (!firestore) return;
    const clientDocRef = doc(firestore, 'clients', clientId);
    deleteDocumentNonBlocking(clientDocRef);
  };
  
  const handleOpenDialog = (open: boolean) => {
    if (!open) {
        setEditingClient(undefined);
    }
    setIsDialogOpen(open);
  }

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);
  
  const isLoading = isUserLoading || areClientsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">CRM / Clientes</h1>
        <p className="text-muted-foreground">Gestiona tu base de clientes y contactos.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo cliente
                </Button>
              </div>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Límite Crédito</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Cargando clientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No se encontraron clientes.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map(client => (
                    <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.rfc}</TableCell>
                        <TableCell>{client.contact}</TableCell>
                        <TableCell>MXN {client.creditLimit.toFixed(2)}</TableCell>
                        <TableCell>
                             <Badge
                                variant={client.status === 'Activo' ? 'secondary' : 'destructive'}
                                className={cn(
                                    client.status === 'Activo' && 'bg-green-100 text-green-700',
                                    client.status === 'Inactivo' && 'bg-red-100 text-red-700'
                                )}>
                                {client.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(client.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      <AddClientDialog
        isOpen={isDialogOpen}
        onOpenChange={handleOpenDialog}
        onAddClient={handleAddClient}
        editingClient={editingClient}
      />
    </div>
  );
}
