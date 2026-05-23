import { AdminLayout } from "@/components/layout/AdminLayout";
import TicketList from "@/features/admin/components/TicketList";

export default function AdminTicketsPage() {
  return (
    <AdminLayout
      title="Tickets internos"
      description="Gerencie os encaminhamentos feitos pelo chatbot para a equipe interna."
    >
      <TicketList />
    </AdminLayout>
  );
}
