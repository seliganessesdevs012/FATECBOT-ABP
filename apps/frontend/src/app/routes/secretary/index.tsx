import { Navigate } from "react-router-dom";

import { PANEL_HOME_PATH } from "@/features/admin/config/panel-access";

export default function SecretaryPage() {
  return <Navigate to={PANEL_HOME_PATH} replace />;
}
