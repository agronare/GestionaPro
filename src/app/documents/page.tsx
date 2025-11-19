'use client';
import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DocumentTable } from '@/components/documents/document-table';
import { AddDocumentDialog } from '@/components/documents/add-document-dialog';
import type { Document } from '@/lib/types';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useUser } from '@/firebase';

export default function DocumentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  
  const documentsCollection = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return collection(firestore, 'documents');
  }, [firestore, user]);

  const { data: documents, isLoading } = useCollection<Document>(documentsCollection);

  const handleAddDocument = (
    newDocumentData: Omit<Document, 'id' | 'uploadDate' | 'size' | 'fileLocation'>
  ) => {
    if (!documentsCollection) return;
    const newDocument: Omit<Document, 'id'> = {
      ...newDocumentData,
      uploadDate: format(new Date(), 'PP'),
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      fileLocation: `/${newDocumentData.name.replace(/\s+/g, '_')}`
    };
    addDocumentNonBlocking(documentsCollection, newDocument);
  };
  
  const handleDeleteDocument = (documentId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', documentId);
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Reportes
        </h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Subir Documento
        </Button>
      </div>
      <div className="p-1 rounded-lg border bg-card text-card-foreground shadow-sm">
        <DocumentTable 
            documents={documents} 
            isLoading={isLoading} 
            onDelete={handleDeleteDocument} 
        />
      </div>
      <AddDocumentDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddDocument={handleAddDocument}
      />
    </div>
  );
}
