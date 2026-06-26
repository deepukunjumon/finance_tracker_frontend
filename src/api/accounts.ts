import { api } from '@/api/axios';
import type { Account, AccountType, ApiResponse, User } from '@/types';

export interface CompleteOnboardingPayload {
  currency: string;
  cash_balance: number;
}

export interface StoreAccountPayload {
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
  notes?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  type?: AccountType;
  balance?: number;
  color?: string;
  notes?: string;
}

export async function completeOnboarding(payload: CompleteOnboardingPayload): Promise<User> {
  const response = await api.post<ApiResponse<User>>('/onboarding/complete', payload);
  return response.data.data;
}

export async function getAccounts(): Promise<Account[]> {
  const response = await api.get<ApiResponse<Account[]>>('/accounts');
  return response.data.data;
}

export async function createAccount(payload: StoreAccountPayload): Promise<Account> {
  const response = await api.post<ApiResponse<Account>>('/accounts', payload);
  return response.data.data;
}

export async function updateAccount(id: string, payload: UpdateAccountPayload): Promise<Account> {
  const response = await api.put<ApiResponse<Account>>(`/accounts/${id}`, payload);
  return response.data.data;
}

export async function archiveAccount(id: string): Promise<Account> {
  const response = await api.patch<ApiResponse<Account>>(`/accounts/${id}/archive`);
  return response.data.data;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}

export async function adjustByRecord(id: string, newBalance: number): Promise<Account> {
  const response = await api.post<ApiResponse<Account>>(`/accounts/${id}/adjust-balance`, {
    type: 'adjust_by_record',
    new_balance: newBalance,
  });
  return response.data.data;
}

export async function changeInitialBalance(id: string, newInitialBalance: number): Promise<Account> {
  const response = await api.post<ApiResponse<Account>>(`/accounts/${id}/adjust-balance`, {
    type: 'change_initial_balance',
    new_initial_balance: newInitialBalance,
  });
  return response.data.data;
}
