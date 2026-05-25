import { AdminLayout } from "@/components/layout/AdminLayout";
import AdminDashboardOverview from "@/features/admin/components/AdminDashboardOverview";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export default function AdminDashboardPage() {
  const userName = useAuthStore(state => state.user?.name ?? "Usuario");

  return (
    <AdminLayout
      title="Dashboard"
      hidePageHeader
      contentClassName="pt-0"
    >
      <AdminDashboardOverview userName={userName} />
    </AdminLayout>
  );
}
