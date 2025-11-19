import type { Document } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { MoreHorizontal, File } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';

type DocumentTableProps = {
  documents: Document[] | null;
  isLoading: boolean;
  onDelete: (documentId: string) => void;
};

export function DocumentTable({ documents, isLoading, onDelete }: DocumentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead className="hidden md:table-cell">Subido por</TableHead>
          <TableHead className="hidden lg:table-cell">Fecha de Subida</TableHead>
          <TableHead className="text-right">Tamaño</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-5"/></TableCell>
                <TableCell><Skeleton className="h-4 w-48"/></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24"/></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20"/></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto"/></TableCell>
                <TableCell><Skeleton className="h-8 w-8 ml-auto"/></TableCell>
            </TableRow>
          ))
        ) : documents?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No hay documentos.
            </TableCell>
          </TableRow>
        ) : (
          documents?.map(doc => (
          <TableRow key={doc.id}>
            <TableCell>
              <File className="h-5 w-5 text-muted-foreground" />
            </TableCell>
            <TableCell className="font-medium">{doc.name}</TableCell>
            <TableCell className="hidden md:table-cell">{doc.uploadedBy}</TableCell>
            <TableCell className="hidden lg:table-cell">{doc.uploadDate}</TableCell>
            <TableCell className="text-right">{doc.size}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Descargar</DropdownMenuItem>
                  <DropdownMenuItem>Renombrar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(doc.id)}>
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )))}
      </TableBody>
    </Table>
  );
}
