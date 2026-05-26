import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  PanelEmptyState,
  PanelPageIntro,
  PanelSectionCard,
  PanelStatCard,
  PanelTableCard,
} from "@/components/shared/panel/PanelScaffold";
import { ShieldCheck, Users } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-feedback";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/date.utils";

import {
  usersApi,
  type AdminUser,
  type CreateUserPayload,
} from "../api/users.api";

const createUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter no minimo 3 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
  role: z.enum(["ADMIN", "SECRETARIA"]),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type RoleFilter = "ALL" | "ADMIN" | "SECRETARIA";

const USERS_QUERY_KEY = ["admin", "users"] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export interface UserListProps {
  className?: string;
}

const UserList = ({ className }: UserListProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [...USERS_QUERY_KEY, DEFAULT_PAGE, DEFAULT_LIMIT],
    queryFn: () =>
      usersApi.list({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: "onChange",
  });

  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      reset();
      setIsCreateOpen(false);
      setSuccessMessage("Novo acesso interno criado com sucesso.");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      setSuccessMessage("Usuario removido com sucesso.");
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const users = listQuery.data?.data ?? [];
  const total = listQuery.data?.meta?.total ?? users.length;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      user.name.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch);

    return matchesRole && matchesSearch;
  });
  const isCreateBusy = createUserMutation.isPending;

  const createErrorMessage = createUserMutation.isError
    ? getApiErrorMessage(
        createUserMutation.error,
        "Nao foi possivel criar usuario.",
      )
    : null;
  const deleteErrorMessage = deleteUserMutation.isError
    ? getApiErrorMessage(
        deleteUserMutation.error,
        "Nao foi possivel remover usuario.",
      )
    : null;

  const handleCreate = (data: CreateUserFormData) => {
    const payload: CreateUserPayload = {
      ...data,
    };

    createUserMutation.mutate(payload);
  };

  const handleDelete = (user: AdminUser) => {
    const confirmed = window.confirm(
      `Remover o usuario ${user.name}? Esta acao nao pode ser desfeita.`,
    );

    if (!confirmed || deleteUserMutation.isPending) {
      return;
    }

    setDeletingId(user.id);
    deleteUserMutation.mutate(user.id);
  };

  const closeCreateModal = () => {
    reset();
    createUserMutation.reset();
    setIsCreateOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
  };

  if (listQuery.isLoading) {
    return <LoadingSpinner message="Carregando usuarios..." />;
  }

  if (listQuery.isError) {
    return (
      <ErrorAlert
        title="Erro ao carregar usuarios"
        message={getApiErrorMessage(listQuery.error, "Tente novamente.")}
        onRetry={() => listQuery.refetch()}
      />
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <PanelPageIntro
        icon={Users}
        badge="Acessos internos"
        title="Usuarios do painel"
        description="Gerencie quem pode acessar o painel administrativo e operacional, mantendo controle entre perfis de secretaria e administracao."
        aside={
          <>
            <PanelStatCard label="Usuarios exibidos" value={filteredUsers.length} supportingText={`Base atual: ${total} cadastro(s)`} />
            <PanelStatCard
              label="Administracao"
              value={users.filter(user => user.role === "ADMIN").length}
              supportingText={`Secretarias: ${users.filter(user => user.role === "SECRETARIA").length}`}
            />
          </>
        }
      />

      <PanelSectionCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-3 md:flex-1 md:grid-cols-[minmax(0,1.8fr)_220px_auto] md:items-end">
            <div className="space-y-1">
              <Label htmlFor="users-search">Buscar</Label>
              <Input
                id="users-search"
                type="search"
                placeholder="Buscar por nome ou email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="users-role-filter">Perfil</Label>
              <select
                id="users-role-filter"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as RoleFilter)
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="ALL">Todos</option>
                <option value="ADMIN">Admin</option>
                <option value="SECRETARIA">Secretaria</option>
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={searchTerm.length === 0 && roleFilter === "ALL"}
            >
              Limpar filtros
            </Button>
          </div>

          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            Novo acesso
          </Button>
        </div>
      </PanelSectionCard>

      {successMessage ? (
        <ErrorAlert
          variant="info"
          title="Usuarios atualizados"
          message={successMessage}
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      {createErrorMessage ? (
        <ErrorAlert
          title="Erro ao criar usuario"
          message={createErrorMessage}
          dismissible
          onDismiss={() => createUserMutation.reset()}
        />
      ) : null}

      {deleteErrorMessage ? (
        <ErrorAlert
          title="Erro ao remover usuario"
          message={deleteErrorMessage}
          dismissible
          onDismiss={() => deleteUserMutation.reset()}
        />
      ) : null}

      {filteredUsers.length === 0 ? (
        <PanelEmptyState
          title={
            users.length === 0
              ? "Nenhum usuario cadastrado ate o momento."
              : "Nenhum usuario corresponde aos filtros aplicados."
          }
          description="Ajuste os filtros ou crie um novo acesso interno para continuar."
        />
      ) : (
        <PanelTableCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--brand-secondary-soft)] text-xs uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Perfil</th>
                  <th className="px-4 py-3 text-left font-medium">Criado em</th>
                  <th className="px-4 py-3 text-right font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE5D9]">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-[#FFF9F0]"
                  >
                    <td className="px-4 py-3 font-medium text-[#1C262E]">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-[#6E6252]">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#FCF8F2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-secondary)]">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6E6252]">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        disabled={
                          deleteUserMutation.isPending && deletingId === user.id
                        }
                      >
                        {deleteUserMutation.isPending && deletingId === user.id
                          ? "Removendo..."
                          : "Remover"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelTableCard>
      )}

      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-[28px] border border-[#E3D8CA] bg-white p-6 shadow-[0_20px_45px_rgba(76,56,24,0.16)]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F6EFE4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6548]">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Novo acesso
                </div>
                <h3 className="text-lg font-semibold text-[#1C262E]">
                  Criar acesso interno
                </h3>
                <p className="text-sm text-[#6E6252]">
                  Escolha se o novo acesso sera administrativo ou operacional.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeCreateModal}
              >
                Fechar
              </Button>
            </div>

            <form
              onSubmit={handleSubmit(handleCreate)}
              className="mt-6 space-y-4"
            >
              <div className="space-y-1">
                <Label htmlFor="user-name">Nome</Label>
                <Input
                  id="user-name"
                  type="text"
                  placeholder="Nome completo"
                  aria-invalid={Boolean(errors.name)}
                  disabled={isCreateBusy}
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="email@fatec.sp.gov.br"
                  aria-invalid={Boolean(errors.email)}
                  disabled={isCreateBusy}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label htmlFor="user-password">Senha</Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Senha temporaria"
                  aria-invalid={Boolean(errors.password)}
                  disabled={isCreateBusy}
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label htmlFor="user-role">Perfil de acesso</Label>
                <select
                  id="user-role"
                  aria-invalid={Boolean(errors.role)}
                  disabled={isCreateBusy}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("role")}
                  defaultValue="SECRETARIA"
                >
                  <option value="SECRETARIA">Secretaria</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {errors.role ? (
                  <p className="text-xs text-destructive">
                    {errors.role.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Admin pode gerenciar o painel; secretaria atua no fluxo operacional.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreateModal}
                  disabled={isCreateBusy}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreateBusy}>
                  {isCreateBusy ? "Salvando..." : "Criar acesso"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default UserList;
