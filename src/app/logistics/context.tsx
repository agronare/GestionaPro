'use client';
import React, { createContext, useContext, useState, ReactNode, memo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Delivery } from './deliveries/page';
import type { Pickup } from './recolecciones/page';
import type { LogisticsExpense } from './expenses/page';


export type Vehicle = {
  id: string;
  name: string;
  plate: string;
  type: 'Camioneta' | 'Tractor' | 'Camión';
  status: 'Disponible' | 'En Ruta' | 'Mantenimiento';
  brand?: string;
  model?: string;
  year?: number;
  capacity?: string;
  fuelEfficiency?: number; // km/l
  fuelType?: 'Diesel' | 'Gasolina';
};

interface LogisticsContextType {
  vehicles: Vehicle[] | null;
  deliveries: Delivery[] | null;
  pickups: Pickup[] | null;
  expenses: LogisticsExpense[] | null;
  isLoading: boolean;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export function LogisticsProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();

  const vehiclesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'vehicles'));
  }, [firestore, user]);
  const { data: vehicles, isLoading: isLoadingVehicles } = useCollection<Vehicle>(vehiclesCollection);
  
  const deliveriesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'deliveries'));
  }, [firestore, user]);
  const { data: deliveries, isLoading: isLoadingDeliveries } = useCollection<Delivery>(deliveriesCollection);

  const pickupsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'pickups'));
  }, [firestore, user]);
  const { data: pickups, isLoading: isLoadingPickups } = useCollection<Pickup>(pickupsCollection);

  const expensesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'logistics_expenses'));
  }, [firestore, user]);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<LogisticsExpense>(expensesCollection);


  const value = {
    vehicles,
    deliveries,
    pickups,
    expenses,
    isLoading: isLoadingVehicles || isLoadingDeliveries || isLoadingPickups || isLoadingExpenses,
  };

  return (
    <LogisticsContext.Provider value={value}>
      {children}
    </LogisticsContext.Provider>
  );
}

export function useLogistics() {
  const context = useContext(LogisticsContext);
  if (context === undefined) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
}

    