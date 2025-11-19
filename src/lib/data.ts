import type { Employee, Transaction, Document, Invoice, RecentActivity } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { format, subDays, subMonths } from 'date-fns';

const now = new Date();

export const employees: Employee[] = [
  { id: '1', name: 'Ana Pérez', email: 'ana.perez@example.com', role: 'Admin', status: 'Active', avatarUrl: PlaceHolderImages[0].imageUrl, joinDate: format(subDays(now, 250), 'PP'), employeeNumber: '1001', position: 'CEO', department: 'Management', baseSalary: 100000, assignedBranch: 'Matriz', hasSystemAccess: true },
  { id: '2', name: 'Luis García', email: 'luis.garcia@example.com', role: 'Manager', status: 'Active', avatarUrl: PlaceHolderImages[1].imageUrl, joinDate: format(subDays(now, 150), 'PP'), employeeNumber: '1002', position: 'Sales Manager', department: 'Sales', baseSalary: 75000, assignedBranch: 'Matriz', hasSystemAccess: true },
  { id: '3', name: 'Carlos López', email: 'carlos.lopez@example.com', role: 'Employee', status: 'Active', avatarUrl: PlaceHolderImages[2].imageUrl, joinDate: format(subDays(now, 60), 'PP'), employeeNumber: '1003', position: 'Sales Rep', department: 'Sales', baseSalary: 50000, assignedBranch: 'Matriz', hasSystemAccess: true },
  { id: '4', name: 'Sofía Martínez', email: 'sofia.martinez@example.com', role: 'Employee', status: 'Inactive', avatarUrl: PlaceHolderImages[3].imageUrl, joinDate: format(subDays(now, 400), 'PP'), employeeNumber: '1004', position: 'Accountant', department: 'Finance', baseSalary: 60000, assignedBranch: 'Matriz', hasSystemAccess: false },
  { id: '5', name: 'Javier Rodríguez', email: 'javier.rodriguez@example.com', role: 'Employee', status: 'Active', avatarUrl: PlaceHolderImages[4].imageUrl, joinDate: format(subDays(now, 20), 'PP'), employeeNumber: '1005', position: 'Warehouse', department: 'Logistics', baseSalary: 45000, assignedBranch: 'Matriz', hasSystemAccess: true },
];

export const income: Transaction[] = [
  { id: '1', description: 'Venta de Proyecto Alfa', amount: 25000, date: format(subDays(now, 5), 'PP'), category: 'Sales' },
  { id: '2', description: 'Consultoría Cliente Beta', amount: 15000, date: format(subDays(now, 15), 'PP'), category: 'Sales' },
  { id: '3', description: 'Venta de Licencias', amount: 7500, date: format(subDays(now, 25), 'PP'), category: 'Software' },
  { id: '4', description: 'Ingreso por Publicidad', amount: 3000, date: format(subDays(now, 40), 'PP'), category: 'Marketing' },
];

export const expenses: Transaction[] = [
  { id: '1', description: 'Nómina de Empleados', amount: 18000, date: format(subDays(now, 2), 'PP'), category: 'Salary' },
  { id: '2', description: 'Licencias de Software', amount: 2500, date: format(subDays(now, 10), 'PP'), category: 'Software' },
  { id: '3', description: 'Campaña de Marketing Digital', amount: 5000, date: format(subDays(now, 20), 'PP'), category: 'Marketing' },
  { id: '4', description: 'Gastos de Oficina', amount: 1200, date: format(subDays(now, 35), 'PP'), category: 'Other' },
];

export const financialChartData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const monthName = format(month, 'MMM');
    return {
        name: monthName,
        ventas: Math.floor(Math.random() * (10000 - 1500 + 1)) + 1500,
    };
});

export const inventarioChartData = [
    { name: "Fertilizantes", value: 400 },
    { name: "Herbicidas", value: 300 },
    { name: "Insecticidas", value: 200 },
    { name: "Equipo", value: 278 },
    { name: "Semillas", value: 189 },
];

export const documents: Document[] = [
  { id: '1', name: 'Contrato_Cliente_Alfa.pdf', uploadedBy: 'Ana Pérez', uploadDate: format(subDays(now, 30), 'PP'), size: '2.5 MB', employeeId: '1' },
  { id: '2', name: 'Propuesta_Proyecto_Beta.docx', uploadedBy: 'Luis García', uploadDate: format(subDays(now, 20), 'PP'), size: '1.8 MB', employeeId: '2' },
  { id: '3', name: 'Reporte_Financiero_Q2.xlsx', uploadedBy: 'Ana Pérez', uploadDate: format(subDays(now, 10), 'PP'), size: '850 KB', employeeId: '1' },
  { id: '4', name: 'Manual_de_Marca.pdf', uploadedBy: 'Luis García', uploadDate: format(subDays(now, 5), 'PP'), size: '5.2 MB', employeeId: '2' },
];

export const invoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-001', clientName: 'Corp Alfa', amount: 25000, issueDate: format(subDays(now, 5), 'PP'), dueDate: format(subDays(now, -25), 'PP'), status: 'Pending' },
  { id: '2', invoiceNumber: 'INV-002', clientName: 'Tech Beta', amount: 15000, issueDate: format(subDays(now, 15), 'PP'), dueDate: format(subDays(now, -15), 'PP'), status: 'Pending' },
  { id: '3', invoiceNumber: 'INV-003', clientName: 'Servicios Gamma', amount: 18000, issueDate: format(subDays(now, 45), 'PP'), dueDate: format(subDays(now, 15), 'PP'), status: 'Paid' },
  { id: '4', invoiceNumber: 'INV-004', clientName: 'Innovate Delta', amount: 32000, issueDate: format(subDays(now, 60), 'PP'), dueDate: format(subDays(now, 30), 'PP'), status: 'Overdue' },
];

export const recentActivity: RecentActivity[] = [
    {id: '1', user: 'Ana Pérez', userAvatar: PlaceHolderImages[0].imageUrl, action: 'generó la factura INV-002.', timestamp: 'hace 5 minutos'},
    {id: '2', user: 'Luis García', userAvatar: PlaceHolderImages[1].imageUrl, action: 'añadió un nuevo empleado: Javier Rodríguez.', timestamp: 'hace 2 horas'},
    {id: '3', user: 'Carlos López', userAvatar: PlaceHolderImages[2].imageUrl, action: 'subió el documento Reporte_Financiero_Q2.xlsx.', timestamp: 'hace 1 día'},
    {id: '4', user: 'Ana Pérez', userAvatar: PlaceHolderImages[0].imageUrl, action: 'registró un gasto de $5,000.', timestamp: 'hace 2 días'},
];