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

export interface CvExperience {
  company: string | null;
  title: string | null;
  description: string | null;
  duration: string | null;
}

export interface CvEducation {
  degree: string | null;
  school_name: string | null;
  duration: string | null;
}

export interface CvLanguage {
  language: string | null;
  level: string | null;
}

export interface CvDetails {
  desired_job: string | null;
  resume: string | null;
  experiences: CvExperience[];
  education: CvEducation[];
  technical_skills: string[];
  languages: CvLanguage[];
}

/**
 * Mirror of the server GetApplicationDto: top-level fields are camelCase with
 * ISO date strings. The nested `offerDetails`/`cvDetails` payloads keep the
 * snake_case keys produced by the LLM extraction (see OfferDetails/CvDetails).
 */
export interface Application {
  applicationId: string;
  companyName: string | null;
  jobTitle: string | null;
  status: ApplicationStatus;
  offerUrl: string | null;
  offerDetails: OfferDetails | null;
  cvDetails: CvDetails | null;
  appliedAt: string;
  /** Optional interview date/time (ISO string), null until scheduled. */
  interviewAt: string | null;
  updatedAt: string;
}

export interface RoadmapTopic {
  title: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  rationale: string;
  gap: boolean;
}

/**
 * A forward-looking interview talking point: a responsibility from the offer
 * plus your CV-grounded angle on it. Fuels the "Bring these to your interview"
 * section — distinct from the gap-driven `topics`.
 */
export interface RoadmapTalkingPoint {
  mission: string;
  angle: string;
}

/**
 * Mirror of the server GetRoadmapDto (F6 preparation path). Keys stay
 * snake_case exactly as the LLM extraction produces them, like
 * OfferDetails/CvDetails above.
 */
export interface Roadmap {
  match_score: number;
  summary: string;
  topics: RoadmapTopic[];
  /** Empty when the offer lists no missions, or for pre-existing cached roadmaps. */
  talking_points: RoadmapTalkingPoint[];
}
