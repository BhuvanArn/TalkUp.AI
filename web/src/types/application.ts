/**
 * Application types come from the API service layer; this re-export keeps the
 * historical import path alive for consumers.
 */
export type {
  Application,
  ApplicationStatus,
  CvDetails,
  OfferDetails,
} from '@/services/applications/types';
