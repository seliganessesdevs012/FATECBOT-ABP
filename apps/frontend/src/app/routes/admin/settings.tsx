import { AdminLayout } from "@/components/layout/AdminLayout";
import { SettingsPanel } from "@/features/admin/components/SettingsPanel";

export default function AdminSettingsPage() {
  return (
    <AdminLayout
      title="Configuracoes da conta"
      description="Altere a senha do usuario autenticado diretamente neste painel."
      hidePageHeader
    >
      <SettingsPanel />
    </AdminLayout>
  );
}
