'use client';
import { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { AddOpportunityDialog } from '@/components/crm/add-opportunity-dialog';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export type Opportunity = {
  id: string;
  title: string;
  clientName: string;
  value: number;
  stage: 'Prospecto' | 'Negociación' | 'Cotización' | 'Seguimiento' | 'Cerrada';
};

const stages: Opportunity['stage'][] = ['Prospecto', 'Negociación', 'Cotización', 'Seguimiento', 'Cerrada'];

export default function PipelinePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const opportunitiesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'opportunities');
  }, [firestore, user]);
  const { data: opportunities, isLoading } = useCollection<Opportunity>(opportunitiesCollection);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddOpportunity = (data: any) => {
    if (!opportunitiesCollection) return;
    const newOpportunity: Omit<Opportunity, 'id'> = {
      title: data.opportunityName,
      clientName: data.client, 
      value: data.estimatedValue,
      stage: 'Prospecto',
    };
    addDocumentNonBlocking(opportunitiesCollection, newOpportunity);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!firestore || !destination) {
        return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
    }

    const opportunityDocRef = doc(firestore, 'opportunities', draggableId);
    updateDocumentNonBlocking(opportunityDocRef, {
        stage: destination.droppableId,
    });
  };
  
  const opportunitiesByStage = useMemo(() => {
    return (stage: Opportunity['stage']) => {
      if (!opportunities) return [];
      return opportunities.filter(op => op.stage === stage);
    }
  }, [opportunities]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Pipeline de Ventas</h1>
          <p className="text-muted-foreground">Visualiza y gestiona oportunidades comerciales.</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Oportunidad
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {stages.map(stage => (
            <Droppable key={stage} droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-w-[300px] w-1/5 flex flex-col"
                >
                  <Card className={`flex-1 flex flex-col bg-muted/40 transition-colors ${snapshot.isDraggingOver ? 'bg-muted' : ''}`}>
                    <CardHeader className='pb-4'>
                      <CardTitle className="text-base font-semibold">{stage}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2 overflow-y-auto">
                      {isLoading && !opportunities ? (
                        <p className="text-sm text-muted-foreground">Cargando...</p>
                      ) : (
                        opportunitiesByStage(stage).map((op, index) => (
                          <Draggable key={op.id} draggableId={op.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                              >
                                 <Card className={`bg-card hover:bg-card/90 ${snapshot.isDragging ? 'shadow-lg' : ''}`}>
                                    <CardContent className="p-3">
                                      <p className="font-semibold text-sm">{op.title}</p>
                                      <p className="text-xs text-muted-foreground">{op.clientName}</p>
                                      <p className="text-sm font-bold mt-2">${op.value.toLocaleString('es-MX')}</p>
                                    </CardContent>
                                  </Card>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                      {!isLoading && opportunitiesByStage(stage).length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4">
                          Arrastra oportunidades aquí
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <AddOpportunityDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddOpportunity={handleAddOpportunity}
       />
    </div>
  );
}
