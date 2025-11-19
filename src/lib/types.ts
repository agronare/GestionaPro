import { Timestamp } from 'firebase/firestore';
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  status: 'Active' | 'Inactive';
  avatarUrl: string;
  joinDate: string;
  employeeNumber?: string;
  position: string;
  department: string;
  baseSalary: number;
  assignedBranch: string;
  hasSystemAccess: boolean;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Salary' | 'Marketing' | 'Sales' | 'Software' | 'Other';
};

export type Document = {
  id: string;
  name: string;
  uploadedBy: string; // Employee Name
  employeeId: string;
  uploadDate: string;
  size: string; // e.g., "1.2 MB"
  fileLocation: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';
};

export type RecentActivity = {
  id: string;
  user: string; // Employee Name
  userAvatar: string;
  action: string;
  timestamp: string;
};

export type PayrollRun = {
  id: string;
  type: 'Quincenal' | 'Semanal' | 'Mensual';
  period: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  employeeCount: number;
  totalAmount: number;
  status: 'En Borrador' | 'Pagada' | 'Cancelada';
};

export type Notification = {
    id: string;
    title: string;
    description: string;
    createdAt: Timestamp;
    isRead: boolean;
    link: string;
    iconName: keyof typeof NOTIFICATION_ICONS;
};

import { ShoppingCart, Users, TrendingUp, Truck, Package } from 'lucide-react';

export const NOTIFICATION_ICONS: { [key: string]: LucideIcon } = {
    ShoppingCart,
    Users,
    TrendingUp,
    Truck,
    Package
};

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  sku: z.string().min(1, 'El SKU es requerido.'),
  description: z.string().optional().nullable(),
  category: z.string().min(1, 'La categoría es requerida.'),
  price: z.coerce.number().min(0, 'El precio debe ser un número positivo.'),
  cost: z.coerce.number().optional().nullable(),
  companyName: z.string().optional().nullable(),
  activeIngredient: z.string().optional().nullable(),
  isBulk: z.boolean().optional(),
  salesUnit: z.string().optional().nullable(),
  purchaseUnit: z.string().optional().nullable(),
  conversionFactor: z.coerce.number().optional().nullable(),
  technicalSheetUrl: z.string().url().optional().or(z.literal('')).nullable(),
  applicationGuideUrl: z.string().url().optional().or(z.literal('')).nullable(),
  objetoImp: z.string().optional(),
  ivaRate: z.coerce.number().optional().nullable(),
  iepsRate: z.coerce.number().optional().nullable(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductWithInventory = Product & { stock: number };

export const SaleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0."),
  price: z.coerce.number(),
  stock: z.number(),
  cost: z.coerce.number(),
});
export type SaleItem = z.infer<typeof SaleItemSchema>;


export const SaleSchema = z.object({
  branchId: z.string().min(1, "Seleccione una sucursal."),
  clientId: z.string().min(1, "Seleccione un cliente."),
  paymentMethod: z.string(),
  items: z.array(SaleItemSchema).min(1, "Agregue al menos un producto."),
});

export type Sale = {
    id: string;
    branchId: string;
    clientId: string | null;
    clientName: string;
    rfc?: string;
    items: SaleItem[];
    paymentMethod: string;
    total: number;
    totalCost: number;
    margin: number;
    date: Date;
    timbrado: boolean;
    uuid?: string;
    cfdi?: string;
    status: 'Pendiente' | 'Pagada' | 'Cancelada';
}

export const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  rfc: z.string().optional(),
  contact: z.string().optional(),
  creditLimit: z.coerce.number().optional(),
  creditUsed: z.coerce.number().optional(),
  status: z.enum(['Activo', 'Inactivo']).optional(),
  address: z.string().optional(),
  hasCredit: z.boolean().optional(),
});
export type Client = z.infer<typeof ClientSchema> & {
    id?: string;
    status: 'Activo' | 'Inactivo';
    createdAt?: Timestamp;
};


export const SupplierSchema = ClientSchema.extend({
    companyName: z.string().min(1, "El nombre de la empresa es requerido."),
    contactName: z.string().min(1, "El nombre del contacto es requerido."),
    phone: z.string().min(1, "El teléfono es requerido."),
});
export type Supplier = z.infer<typeof SupplierSchema> & { id?: string; address?: string; hasCredit?: boolean; creditUsed?: number; creditLimit?: number; };


export type InventoryItem = {
    id: string;
    productName: string;
    sku: string;
    lot: string;
    quantity: number;
    unitPrice: number;
    entryDate: string | Date;
    branchId: string;
};

export type Branch = {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
};

export const QuoteItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  price: z.coerce.number().min(0, "El precio debe ser un número positivo."),
});

export const QuoteSchema = z.object({
  id: z.string().optional(),
  quoteNumber: z.string().min(1, "El número de cotización es requerido."),
  supplierId: z.string().min(1, "El proveedor es requerido."),
  supplierName: z.string().optional(),
  date: z.date(),
  items: z.array(QuoteItemSchema).min(1, "Debe haber al menos un producto."),
  campaign: z.string().optional(),
  status: z.enum(['Pendiente', 'Aprobada', 'Rechazada']),
});
export type Quote = z.infer<typeof QuoteSchema> & { id?: string };
export type QuoteStatus = 'Pendiente' | 'Aprobada' | 'Rechazada';

export const PurchaseItemSchema = z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number(),
    cost: z.number(),
    lotNumber: z.string().optional(),
    realCost: z.number().optional(),
});

export const PurchaseOrderSchema = z.object({
    id: z.string().optional(),
    receptionId: z.string().optional(),
    supplierId: z.string(),
    supplierName: z.string(),
    branchId: z.string(),
    date: z.date(),
    items: z.array(PurchaseItemSchema),
    associatedCosts: z.array(z.object({
        concept: z.string(),
        amount: z.number(),
        prorate: z.boolean(),
    })).optional(),
    total: z.number(),
    status: z.enum(['Pendiente', 'Completada', 'Cancelada']),
    notes: z.string(),
    quoteId: z.string().optional(),
    paymentMethod: z.enum(['Efectivo', 'Tarjeta', 'Credito']),
    previousStatus: z.string().optional(),
    logisticsStatus: z.string().optional(),
});

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema> & { id?: string };
export type PurchaseOrderStatus = 'Pendiente' | 'Completada' | 'Cancelada';


export const FixedAssetSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  status: z.string(),
  acquisitionCost: z.number(),
  acquisitionDate: z.instanceof(Timestamp),
  usefulLife: z.number(), // in years
  location: z.string(),
  monthlyDepreciation: z.number(),
  currentValue: z.number(),
});
export type FixedAsset = z.infer<typeof FixedAssetSchema> & { id?: string };
