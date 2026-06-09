import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { z } from "zod";

import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  PanelPageIntro,
  PanelSectionCard,
} from "@/components/shared/panel/PanelScaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-feedback";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/stores/auth.store";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Informe sua senha atual"),
    newPassword: z
      .string()
      .min(6, "A nova senha deve ter no mínimo 6 caracteres"),
    confirmNewPassword: z.string().min(6, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "A confirmação da nova senha não confere",
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export interface SettingsPanelProps {
  className?: string;
}

export function SettingsPanel({ className = "" }: SettingsPanelProps) {
  const user = useAuthStore((state) => state.user);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      reset();
      setSuccessMessage("Senha atualizada com sucesso.");
    },
  });

  const onSubmit = (values: ChangePasswordFormData) => {
    setSuccessMessage(null);
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  const errorMessage = changePasswordMutation.isError
    ? getApiErrorMessage(
        changePasswordMutation.error,
        "Não foi possível atualizar a senha.",
      )
    : null;

  const isBusy = changePasswordMutation.isPending;

  return (
    <div className={className}>
      <div className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <PanelPageIntro
          icon={ShieldCheck}
          badge="Configurações da conta"
          title="Atualize a senha do acesso atual"
          description="A tela abaixo altera apenas a senha do usuário autenticado. Os demais dados da conta permanecem inalterados."
          aside={
            <>
              <div className="rounded-[20px] bg-[#FCF8F2] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6548]">
                  Usuário logado
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1C262E]">
                  {user?.name ?? "Usuário autenticado"}
                </p>
                <p className="text-xs text-[#6E6252]">
                  {user?.email ?? "Sessão ativa"}
                </p>
              </div>
              <div className="rounded-[20px] bg-[#FCF8F2] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6548]">
                  Acesso protegido
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1C262E]">
                  Role {user?.role ?? "indefinido"}
                </p>
                <p className="text-xs text-[#6E6252]">
                  A troca exige a senha atual para confirmar a identidade.
                </p>
              </div>
            </>
          }
        />

        <PanelSectionCard className="flex items-start gap-3 bg-[#FFF9F2]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8A6943] shadow-sm">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#1C262E]">Boas práticas</p>
            <p className="text-sm leading-relaxed text-[#6E6252]">
              Use uma senha forte e guarde a nova credencial em local seguro. O
              sistema não mostra a senha atual em nenhum momento.
            </p>
          </div>
        </PanelSectionCard>
      </div>

      <PanelSectionCard className={className}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4EBDC] text-[#7A6548]">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1C262E]">
              Troca de senha
            </h3>
            <p className="text-sm text-[#6E6252]">
              Preencha os campos abaixo para atualizar a senha da sua conta.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <ErrorAlert message={errorMessage} className="mb-4" />
        ) : null}
        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-[#CBE3C2] bg-[#F3FAEF] px-4 py-3 text-sm font-medium text-[#31582A]">
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Digite a senha atual"
                  autoComplete="current-password"
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.currentPassword)}
                  {...register("currentPassword")}
                />
                {errors.currentPassword ? (
                  <p className="text-sm text-red-600">
                    {errors.currentPassword.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite a nova senha"
                  autoComplete="new-password"
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.newPassword)}
                  {...register("newPassword")}
                />
                {errors.newPassword ? (
                  <p className="text-sm text-red-600">
                    {errors.newPassword.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.confirmNewPassword)}
                  {...register("confirmNewPassword")}
                />
                {errors.confirmNewPassword ? (
                  <p className="text-sm text-red-600">
                    {errors.confirmNewPassword.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6E6252]">
              A senha deve ter no mínimo 6 caracteres.
            </p>

            <Button
              type="submit"
              className="w-full sm:w-auto min-w-[190px] cursor-pointer rounded-2xl bg-[#B20000] text-white hover:bg-[#7D0000]"
              disabled={isBusy}
            >
              {isBusy ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Atualizando...
                </span>
              ) : (
                "Atualizar senha"
              )}
            </Button>
          </div>
        </form>
      </PanelSectionCard>
    </div>
  );
}
