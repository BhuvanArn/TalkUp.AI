import { API_ROUTES } from '../api';
import axiosInstance from '../axiosInstance';
import type { Application, ApplicationStatus } from './types';

export async function fetchApplications(): Promise<Application[]> {
  const { data } = await axiosInstance.get<Application[]>(
    API_ROUTES.applications,
  );
  return data;
}

export async function createApplication(url: string): Promise<Application> {
  const { data } = await axiosInstance.post<Application>(
    API_ROUTES.applications,
    { url },
  );
  return data;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<Application> {
  const { data } = await axiosInstance.patch<Application>(
    `${API_ROUTES.applications}/${applicationId}`,
    { status },
  );
  return data;
}

export async function deleteApplication(applicationId: string): Promise<void> {
  await axiosInstance.delete(`${API_ROUTES.applications}/${applicationId}`);
}
