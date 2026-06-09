import { AdminLayout } from "@/components/layout/AdminLayout";
import UserList from "@/features/admin/components/UserList";

export default function AdminUsersPage() {
  return (
    <AdminLayout
      title="Usuários internos"
      description="Gerencie os acessos internos de admin e secretaria em uma única tabela."
      hidePageHeader
    >
      <UserList />
    </AdminLayout>
  );
}
