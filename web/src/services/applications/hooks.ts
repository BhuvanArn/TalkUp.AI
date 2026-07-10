import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createApplication,
  deleteApplication,
  fetchApplications,
  updateApplicationInterviewAt,
  updateApplicationStatus,
} from './http';
import type { Application, ApplicationStatus } from './types';

export const APPLICATIONS_QUERY_KEY = ['applications'] as const;

export const useApplications = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: APPLICATIONS_QUERY_KEY,
    queryFn: fetchApplications,
    enabled: options?.enabled,
  });

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      url,
      interviewAt,
    }: {
      url: string;
      interviewAt?: string | null;
    }) => createApplication(url, interviewAt),
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
    // Shared scope serializes status/delete mutations so concurrent card ops
    // run one at a time — prevents in-flight cards from racing each other and
    // keeps pendingIds (derived from mutation.variables) correct per card.
    scope: { id: 'applications' },
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

/**
 * Optimistic interview-date change: the card updates immediately, rolls back on
 * error, and reconverges with the server (onSettled invalidation).
 */
export const useUpdateApplicationInterviewAt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: 'applications' },
    mutationFn: ({
      applicationId,
      interviewAt,
    }: {
      applicationId: string;
      interviewAt: string | null;
    }) => updateApplicationInterviewAt(applicationId, interviewAt),
    onMutate: async ({ applicationId, interviewAt }) => {
      await queryClient.cancelQueries({ queryKey: APPLICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<Application[]>(
        APPLICATIONS_QUERY_KEY,
      );
      queryClient.setQueryData<Application[]>(APPLICATIONS_QUERY_KEY, (old) =>
        old?.map((app) =>
          app.applicationId === applicationId ? { ...app, interviewAt } : app,
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
    // Same scope as status updates — serialized against them so a delete and a
    // status change on different cards don't run concurrently.
    scope: { id: 'applications' },
    mutationFn: (applicationId: string) => deleteApplication(applicationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY });
    },
  });
};
