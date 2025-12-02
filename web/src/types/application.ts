/**
 * Application type definition
 */
export interface Application {
  /** Unique identifier */
  id: string;
  /** Company name */
  companyName: string;
  /** Job position/title */
  position: string;
  /** Application status */
  status: 'active' | 'pending' | 'interview' | 'rejected' | 'accepted';
  /** Company logo URL (optional) */
  logoUrl?: string;
  /** Company color for UI (optional) */
  color?: string;
  /** Date application was submitted */
  appliedAt: Date;
  /** Last updated date */
  updatedAt: Date;
  /** Notes about the application */
  notes?: string;
}

/**
 * Mock applications for development
 */
export const mockApplications: Application[] = [
  {
    id: 'google-cloud-france',
    companyName: 'Google Cloud France',
    position: 'Software Engineer',
    status: 'interview',
    color: '#4285F4',
    appliedAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    notes: 'Interview scheduled for next week',
  },
  {
    id: 'microsoft-paris',
    companyName: 'Microsoft Paris',
    position: 'Senior Frontend Developer',
    status: 'active',
    color: '#00A4EF',
    appliedAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'meta-london',
    companyName: 'Meta London',
    position: 'Full Stack Engineer',
    status: 'pending',
    color: '#0668E1',
    appliedAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
  },
];
