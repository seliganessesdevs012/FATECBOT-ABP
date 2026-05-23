import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
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

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      const message = data.message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const UserList = ({ className }: UserListProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
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
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
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
    ? getErrorMessage(
        createUserMutation.error,
        "Nao foi possivel criar usuario.",
      )
    : null;
  const deleteErrorMessage = deleteUserMutation.isError
    ? getErrorMessage(
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
        message={getErrorMessage(listQuery.error, "Tente novamente.")}
        onRetry={() => listQuery.refetch()}
      />
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Usuarios internos
          </h2>
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredUsers.length} de {total} usuarios
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Novo acesso
        </Button>
      </header>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_220px_auto] md:items-end">
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
      </div>

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
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
          {users.length === 0
            ? "Nenhum usuario cadastrado ate o momento."
            : "Nenhum usuario corresponde aos filtros aplicados."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--brand-secondary-soft)] text-xs uppercase text-[var(--brand-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Criado em</th>
                  <th className="px-4 py-3 text-right font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.role}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
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
        </div>
      )}

      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  Criar acesso interno
                </h3>
                <p className="text-sm text-muted-foreground">
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
