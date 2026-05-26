import { AdminLayout } from "@/components/layout/AdminLayout";
import LogTable from "@/features/admin/components/LogTable";

export default function AdminLogsPage() {
  return (
    <AdminLayout
      title="Historico de atendimentos"
      description="Visualize o fluxo percorrido nas sessoes, a satisfacao registrada e as perguntas vinculadas."
      hidePageHeader
    >
      <LogTable />
    </AdminLayout>
  );
}
