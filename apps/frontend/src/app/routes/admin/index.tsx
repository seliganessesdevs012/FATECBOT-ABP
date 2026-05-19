import { ArrowRight, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import { AdminLayout } from "@/components/layout/AdminLayout";

const nextSteps = [
  {
    title: "Nodes",
    description:
      "Integrar NodeTree e NodeEditor na pagina dedicada de gestao da arvore.",
  },
  {
    title: "Usuarios",
    description:
      "Conectar UserList ao fluxo do painel para cadastro e remocao de secretaria.",
  },
  {
    title: "Logs",
    description:
      "Reservar a area de observabilidade para a sprint seguinte sem quebrar a navegacao.",
  },
];

const foundations = [
  "Rota protegida por ProtectedRoute e RoleGuard no app/router.tsx.",
  "Estado autenticado vindo de useAuthStore, sem leitura direta de localStorage.",
  "Layout pronto para receber as paginas da TASK-058 sem duplicar cabecalho ou navegacao.",
];

export default function AdminPage() {
  return (
    <AdminLayout
      title="Painel administrativo"
      description="Base compartilhada do painel interno do FatecBot. A navegacao, o contexto do usuario e o fluxo de logout agora ficam centralizados no layout."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="rounded-[28px] border border-[#E3D8CA] bg-white p-6 shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B20000] text-white">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B20000]">
                Task 057
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#1C262E]">
                Casca do painel entregue
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6E6252]">
                Esta pagina confirma o ponto de entrada do admin com layout
                compartilhado, topbar, logout e estrutura pronta para receber as
                telas especificas do backlog.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {foundations.map(item => (
              <div
                key={item}
                className="rounded-[24px] border border-[#EFE5D8] bg-[#FCF8F2] p-4"
              >
                <div className="inline-flex rounded-full bg-[#EAF3EE] px-3 py-1 text-xs font-semibold text-[#2E6A4F]">
                  Pronto
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#4F463A]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-[#E3D8CA] bg-[#F8F3EA] p-6 shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1C262E] text-white">
                <Layers3 className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1C262E]">
                  Proximas paginas
                </h3>
                <p className="text-sm text-[#6E6252]">
                  Sequencia direta da TASK-058.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {nextSteps.map(step => (
                <div
                  key={step.title}
                  className="rounded-[22px] border border-[#E7DDCF] bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1C262E]">
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[#6E6252]">
                        {step.description}
                      </p>
                    </div>

                    <ArrowRight
                      className="mt-0.5 size-4 shrink-0 text-[#B20000]"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#E3D8CA] bg-white p-6 shadow-[0_18px_40px_rgba(92,53,12,0.06)]">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7E8E6] text-[#B20000]">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1C262E]">
                  Como seguir
                </h3>
                <p className="text-sm text-[#6E6252]">
                  O layout agora vira base unica das rotas do painel.
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#4F463A]">
              <li className="rounded-[20px] bg-[#FCF8F2] px-4 py-3">
                A TASK-058 pode montar `dashboard.tsx`, `nodes.tsx` e
                `users.tsx` sem recriar sidebar ou logout.
              </li>
              <li className="rounded-[20px] bg-[#FCF8F2] px-4 py-3">
                O contrato de layout continua fora da logica de permissao,
                respeitando os guards definidos no roteador.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </AdminLayout>
  );
}
