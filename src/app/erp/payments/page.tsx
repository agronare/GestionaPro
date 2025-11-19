'use client';
import { AbonosTab } from '@/components/crm/abonos-tab';
import { PageHeader } from '@/components/layout/page-header';

export default function PaymentsPage() {

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="ERP / Abonos"
        description="Registra y consulta los abonos de clientes y a proveedores."
      />
      <AbonosTab />
    </div>
  );
}
