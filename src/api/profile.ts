import { api } from '@/api/axios';
import type { ApiResponse, User } from '@/types';

export interface UpdateProfilePayload {
  name: string;
  mobile?: string;
  currency: string;
}

export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export async function getProfile(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/profile');
  return response.data.data;
}

export async function updateProfile(payload: UpdateProfilePayload | FormData): Promise<User> {
  const response = await api.post<ApiResponse<User>>('/profile', payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data.data;
}

export async function updatePassword(payload: UpdatePasswordPayload): Promise<void> {
  await api.put('/profile/password', payload);
}

export async function deactivateAccount(): Promise<void> {
  await api.delete('/profile');
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  budget_alerts: boolean;
  transaction_alerts: boolean;
  weekly_summary: boolean;
  bill_reminders: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await api.get<ApiResponse<NotificationPreferences>>('/profile/notification-preferences');
  return response.data.data;
}

export async function updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
  const response = await api.put<ApiResponse<NotificationPreferences>>('/profile/notification-preferences', prefs);
  return response.data.data;
}

export interface UserPreferences {
  date_format: string;
  default_account_id: string;
  week_start: string;
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const response = await api.get<ApiResponse<UserPreferences>>('/profile/preferences');
  return response.data.data;
}

export async function updateUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const response = await api.put<ApiResponse<UserPreferences>>('/profile/preferences', prefs);
  return response.data.data;
}
