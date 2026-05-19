import { ShieldCheck, UserRoundPlus } from "lucide-react";

import { AdminLayout } from "@/components/layout/AdminLayout";
import UserList from "@/features/admin/components/UserList";

export default function AdminUsersPage() {
  return (
    <AdminLayout
      title="Usuarios internos"
      description="Cadastre e remova acessos da secretaria academica sem misturar esta operacao com as rotas publicas do chatbot."
    >
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
          <article className="rounded-[28px] border border-[#E3D8CA] bg-white p-6 shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1C262E] text-white">
                <UserRoundPlus className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1C262E]">
                  Operacao interna
                </h2>
                <p className="text-sm text-[#6E6252]">
                  Admin e secretaria compartilham o mesmo contexto de
                  atendimento, com niveis diferentes de permissao.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] bg-[#FCF8F2] p-4">
                <p className="text-sm font-semibold text-[#1C262E]">
                  Cadastro atual
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#6E6252]">
                  O fluxo desta interface cria acessos operacionais com role
                  `SECRETARIA`, em linha com o contrato atual da API.
                </p>
              </div>
              <div className="rounded-[22px] bg-[#FCF8F2] p-4">
                <p className="text-sm font-semibold text-[#1C262E]">
                  Camada administrativa
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#6E6252]">
                  O perfil admin continua sendo a extensao com permissoes
                  ampliadas da operacao da secretaria.
                </p>
              </div>
            </div>
          </article>

          <aside className="rounded-[28px] border border-[#E3D8CA] bg-[#F8F3EA] p-6 shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2E6A4F] text-white">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1C262E]">
                  Regra de seguranca
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#6E6252]">
              O provisionamento de novos administradores segue fora deste fluxo
              enquanto o backend mantiver o cadastro restrito a usuarios
              `SECRETARIA`.
            </p>
          </aside>
        </section>

        <UserList />
      </div>
    </AdminLayout>
  );
}
