export type ApplicationStatus = 'sent' | 'interview' | 'accepted' | 'rejected';

export interface OfferDetails {
  job_title: string | null;
  company_name: string | null;
  company_description: string | null;
  sector: string | null;
  contract_type: string | null;
  location: string | null;
  required_skills: string[];
  preferred_skills: string[];
  required_experience: string | null;
  required_education: string | null;
  missions: string[];
  soft_skills: string[];
  languages_required: string[];
  salary_range: string | null;
  company_values: string[];
  team_description: string | null;
}

export interface CvDetails {
  desired_job: string | null;
  resume: string | null;
  experiences: unknown[];
  education: unknown[];
  technical_skills: string[];
  languages: unknown[];
}

/** Mirror of the server GetApplicationDto (camelCase, ISO date strings). */
export interface Application {
  applicationId: string;
  companyName: string | null;
  jobTitle: string | null;
  status: ApplicationStatus;
  offerUrl: string | null;
  offerDetails: OfferDetails | null;
  cvDetails: CvDetails | null;
  appliedAt: string;
  updatedAt: string;
}
