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

export async function uploadMyCV(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  // The axios instance sets a global `Content-Type: application/json` default,
  // which would mislabel this multipart body and make the server drop the file.
  // Overriding to `multipart/form-data` lets axios inject the real boundary from
  // the FormData, so the upload is parsed correctly.
  const { data } = await axiosInstance.post<{ message: string }>(
    `${API_ROUTES.users}/uploadCV`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
