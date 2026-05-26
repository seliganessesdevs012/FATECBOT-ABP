import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import type { LoginPayload } from '../types/auth.types';
import { PANEL_HOME_PATH } from '@/features/admin/config/panel-access';

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),

    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate(PANEL_HOME_PATH);
    },
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
