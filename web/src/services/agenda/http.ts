import { API_ROUTES } from '../api';
import axiosInstance from '../axiosInstance';
import {
  AgendaEvent,
  CreateEventDto,
  GetEventsQueryDto,
  UpdateEventDto,
} from './types';

const AGENDA_API_URL = API_ROUTES.agenda;

/**
 * Fetches a list of agenda events, optionally filtered by a query.
 *
 * @param {GetEventsQueryDto} [query] - Optional query parameters to filter events (e.g., date range).
 * @returns {Promise<AgendaEvent[]>} A promise that resolves to an array of agenda events.
 */
export const getEvents = async (
  query?: GetEventsQueryDto,
): Promise<AgendaEvent[]> => {
  const response = await axiosInstance.get<AgendaEvent[]>(AGENDA_API_URL, {
    params: query,
  });
  return response.data;
};

/**
 * Fetches a single agenda event by its ID.
 *
 * @param {string} id - The unique identifier of the event to retrieve.
 * @returns {Promise<AgendaEvent>} A promise that resolves to the requested agenda event.
 */
export const getEventById = async (id: string): Promise<AgendaEvent> => {
  const response = await axiosInstance.get<AgendaEvent>(
    `${AGENDA_API_URL}/${id}`,
  );
  return response.data;
};

/**
 * Creates a new agenda event.
 *
 * @param {CreateEventDto} dto - The data for the new event.
 * @returns {Promise<AgendaEvent>} A promise that resolves to the created agenda event.
 */
export const createEvent = async (
  dto: CreateEventDto,
): Promise<AgendaEvent> => {
  const response = await axiosInstance.post<AgendaEvent>(AGENDA_API_URL, dto);
  return response.data;
};

/**
 * Updates an existing agenda event.
 *
 * @param {string} id - The unique identifier of the event to update.
 * @param {UpdateEventDto} dto - The data to update the event with.
 * @returns {Promise<AgendaEvent>} A promise that resolves to the updated agenda event.
 */
export const updateEvent = async (
  id: string,
  dto: UpdateEventDto,
): Promise<AgendaEvent> => {
  const response = await axiosInstance.put<AgendaEvent>(
    `${AGENDA_API_URL}/${id}`,
    dto,
  );
  return response.data;
};

/**
 * Deletes an agenda event by its ID.
 *
 * @param {string} id - The unique identifier of the event to delete.
 * @returns {Promise<void>} A promise that resolves when the event has been successfully deleted.
 */
export const deleteEvent = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${AGENDA_API_URL}/${id}`);
};
