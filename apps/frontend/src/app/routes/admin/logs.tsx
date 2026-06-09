import { AdminLayout } from "@/components/layout/AdminLayout";
import LogTable from "@/features/admin/components/LogTable";

export default function AdminLogsPage() {
  return (
    <AdminLayout
      title="Histórico de atendimentos"
      description="Visualize o fluxo percorrido nas sessões, a satisfação registrada e as perguntas vinculadas."
      hidePageHeader
    >
      <LogTable />
    </AdminLayout>
  );
}
