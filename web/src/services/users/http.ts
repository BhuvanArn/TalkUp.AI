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
  // Let axios derive the multipart Content-Type (with its boundary) from the
  // FormData; setting it by hand drops the boundary and breaks the upload.
  const { data } = await axiosInstance.post<{ message: string }>(
    `${API_ROUTES.users}/uploadCV`,
    formData,
  );
  return data;
}
