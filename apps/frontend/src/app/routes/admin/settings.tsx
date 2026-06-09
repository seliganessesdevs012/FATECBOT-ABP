import { AdminLayout } from "@/components/layout/AdminLayout";
import { SettingsPanel } from "@/features/admin/components/SettingsPanel";

export default function AdminSettingsPage() {
  return (
    <AdminLayout
      title="Configurações da conta"
      description="Altere a senha do usuário autenticado diretamente neste painel."
      hidePageHeader
    >
      <SettingsPanel />
    </AdminLayout>
  );
}
