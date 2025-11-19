'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionTable } from './transaction-table';
import type { Transaction } from '@/lib/types';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { AddTransactionDialog } from './add-transaction-dialog';
import { format } from 'date-fns';
import { FinancialStatements } from './financial-statements';

type FinanceTabsProps = {
  income: Transaction[];
  expenses: Transaction[];
};

export function FinanceTabs({
  income: initialIncome,
  expenses: initialExpenses,
}: FinanceTabsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'income' | 'expense'>('income');
  const [income, setIncome] = useState<Transaction[]>(initialIncome);
  const [expenses, setExpenses] = useState<Transaction[]>(initialExpenses);

  const openDialog = (type: 'income' | 'expense') => {
    setDialogType(type);
    setIsDialogOpen(true);
  };
  
  const handleAddTransaction = (data: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      id: `${Math.random()}`,
      date: format(new Date(), 'PP'),
      ...data,
    };
    if (dialogType === 'income') {
      setIncome(prev => [newTransaction, ...prev]);
    } else {
      setExpenses(prev => [newTransaction, ...prev]);
    }
  };

  return (
    <Tabs defaultValue="income">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="income">Ingresos</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="statements">Estados Financieros</TabsTrigger>
        </TabsList>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openDialog('income')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Ingreso
          </Button>
          <Button variant="outline" size="sm" onClick={() => openDialog('expense')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Gasto
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <TabsContent value="income" className="p-1 rounded-lg border bg-card text-card-foreground shadow-sm">
          <TransactionTable transactions={income} type="income" />
        </TabsContent>
        <TabsContent value="expenses" className="p-1 rounded-lg border bg-card text-card-foreground shadow-sm">
          <TransactionTable transactions={expenses} type="expense" />
        </TabsContent>
        <TabsContent value="statements">
            {/* The content is now in finance/page.tsx */}
        </TabsContent>
      </div>
      <AddTransactionDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type={dialogType}
        onAddTransaction={handleAddTransaction}
      />
    </Tabs>
  );
}
