import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createApplication,
  deleteApplication,
  fetchApplications,
  updateApplicationStatus,
} from './http';
import type { Application, ApplicationStatus } from './types';

export const APPLICATIONS_QUERY_KEY = ['applications'] as const;

export const useApplications = () =>
  useQuery({ queryKey: APPLICATIONS_QUERY_KEY, queryFn: fetchApplications });

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => createApplication(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY });
    },
  });
};

/**
 * Optimistic status change: the kanban card moves immediately, rolls back on
 * error, and always reconverges with the server (onSettled invalidation).
 */
export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: ApplicationStatus;
    }) => updateApplicationStatus(applicationId, status),
    onMutate: async ({ applicationId, status }) => {
      await queryClient.cancelQueries({ queryKey: APPLICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<Application[]>(
        APPLICATIONS_QUERY_KEY,
      );
      queryClient.setQueryData<Application[]>(APPLICATIONS_QUERY_KEY, (old) =>
        old?.map((app) =>
          app.applicationId === applicationId ? { ...app, status } : app,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(APPLICATIONS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => deleteApplication(applicationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY });
    },
  });
};
