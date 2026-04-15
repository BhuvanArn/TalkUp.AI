import { API_ROUTES } from '../api';
import axiosInstance from '../axiosInstance';

import type { UpdateProfileBody, UserProfile } from './types';

export async function fetchMyProfile(): Promise<UserProfile> {
  const { data } = await axiosInstance.get<UserProfile>(
    `${API_ROUTES.users}/me`,
  );
  return data;
}

export async function updateMyProfile(
  body: UpdateProfileBody,
): Promise<UserProfile> {
  const { data } = await axiosInstance.patch<UserProfile>(
    `${API_ROUTES.users}/me`,
    body,
  );
  return data;
}

export async function deleteMyAccount(): Promise<void> {
  await axiosInstance.delete(`${API_ROUTES.users}/me`);
}
