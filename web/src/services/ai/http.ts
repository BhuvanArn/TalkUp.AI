import { API_ROUTES } from '../api';
import axiosInstance from '../axiosInstance';
import {
  AiInterviewResponse,
  CreateAiInterviewDto,
  InterviewSessionResponse,
  UpdateAiInterviewDto,
} from './types';

/**
 * Creates a new AI interview by sending the provided DTO to the backend service.
 *
 * Sends a POST request to the AI interviews endpoint and returns the server's response
 * as an AiInterviewResponse object.
 *
 * @param dto - The CreateAiInterviewDto containing the data required to create the interview.
 * @returns A Promise that resolves to the created AiInterviewResponse.
 * @throws Will rethrow any network or server errors encountered while making the request.
 *         Errors are logged to the console before being rethrown.
 * @async
 * @example
 * const created = await createInterview({ type: "technical", language: "English" });
 */
export const createInterview = async (
  dto: CreateAiInterviewDto,
): Promise<AiInterviewResponse> => {
  try {
    const response = await axiosInstance.post<AiInterviewResponse>(
      `${API_ROUTES.ai}/interviews`,
      dto,
    );
    return response.data;
  } catch (error) {
    console.error('Error creating AI interview:', error);
    throw error;
  }
};

/**
 * Update an existing AI interview on the backend.
 *
 * Sends a PUT request to the AI interviews endpoint to update the interview identified by `interviewId`
 * with the values provided in `dto`.
 *
 * @param interviewId - The ID of the interview to update.
 * @param dto - An UpdateAiInterviewDto containing the fields to change on the interview.
 * @returns A Promise that resolves when the update completes successfully.
 * @throws Propagates any error thrown by the underlying HTTP client if the request fails.
 *
 * @example
 * const dto: UpdateAiInterviewDto = { status: 'completed', score: 85, feedback: 'Great performance' };
 * await updateInterview('abc123', dto);
 */
export const getInterviewSession = async (
  interviewId: string,
): Promise<InterviewSessionResponse> => {
  const response = await axiosInstance.get<InterviewSessionResponse>(
    `${API_ROUTES.ai}/interviews/${interviewId}/session`,
  );
  return response.data;
};

export const cancelInterview = async (interviewId: string): Promise<void> => {
  await axiosInstance.post(`${API_ROUTES.ai}/interviews/${interviewId}/cancel`);
};

export const updateInterview = async (
  interviewId: string,
  dto: UpdateAiInterviewDto,
): Promise<void> => {
  try {
    await axiosInstance.put(`${API_ROUTES.ai}/interviews/${interviewId}`, dto);
  } catch (error) {
    console.error('Error updating AI interview:', error);
    throw error;
  }
};
