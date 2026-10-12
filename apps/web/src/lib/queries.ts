import { useQuery } from "@tanstack/react-query";
import type { Column, Me } from "@tm/shared";
import { api } from "./api";

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/me") });

export const useColumns = () =>
  useQuery({ queryKey: ["columns"], queryFn: () => api<Column[]>("/columns") });

export const useAuthConfig = () =>
  useQuery({
    queryKey: ["auth-config"],
    queryFn: () => api<{ devLogin: boolean }>("/auth/config"),
    staleTime: Number.POSITIVE_INFINITY,
  });
