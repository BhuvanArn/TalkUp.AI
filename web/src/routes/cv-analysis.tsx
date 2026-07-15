import { useCreateApplication } from '@/services/applications/hooks';
import type { Application } from '@/services/applications/types';
import { uploadMyCV } from '@/services/users/http';
import { createAuthGuard } from '@/utils/auth.guards';
import { extractErrorMessage } from '@/utils/error';
import { isAllowedJobUrl } from '@/utils/validators';
import { CheckboxInput } from '@/components/atoms/checkbox-input';
import { createFileRoute } from '@tanstack/react-router';
import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { iconMap } from '../components/atoms/icon/icon-map';
import { AIProcessingOverlay } from '../components/organisms/cv-import-ai-processing-overlay';
import { AnalysisResultCard } from '../components/organisms/cv-import-analysis-result-card';
import { UploaderCard } from '../components/organisms/cv-import-uploader-card';

/**
 * @route /cv-analysis
 * @description Main route for CV and Job Offer matching analysis.
 * Orchestrates the three-step workflow: Document Upload, AI Web Scraping/Processing, and Results Display.
 *
 * NOTE: This page handles user CVs (PII), so the auth guard is mandatory.
 */
export const Route = createFileRoute('/cv-analysis')({
  beforeLoad: createAuthGuard('/cv-analysis'),
  component: CVAnalysisPage,
});

/**
 * CVAnalysisPage Component
 * @description
 * Manages the global state and business logic for the CV analysis workflow.
 * Handles file management, URL tracking, and switching between the upload,
 * processing, and result screens.
 * * @returns {JSX.Element} The rendered CV Analysis page.
 */
function CVAnalysisPage() {
  const navigate = Route.useNavigate();
  const CvIcon = iconMap.cv;
  const LinkIcon = iconMap.search;
  const TrashIcon = iconMap.delete;

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [dataConsentAccepted, setDataConsentAccepted] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'cv' | 'offer'>(
    'idle',
  );
  const [createdApplication, setCreatedApplication] =
    useState<Application | null>(null);
  const createApplicationMutation = useCreateApplication();

  const canStart =
    Boolean(cvFile) && isAllowedJobUrl(jobUrl) && dataConsentAccepted;
  const isAnalyzing = analysisStep !== 'idle';
  const isFinished = createdApplication !== null;

  /**
   * Runs the real analysis pipeline: CV upload (profile extraction), then
   * job-offer scrape + application creation. Several seconds per step (LLM) —
   * the overlay reflects the current step; no artificial timeout.
   */
  const handleStartAnalysis = async () => {
    if (!canStart || !cvFile) return;
    // Once the CV upload succeeds it has already overwritten the profile CV on
    // the server; a later failure (offer scrape / application create) can't undo
    // that, so we tell the user their CV was updated instead of pretending
    // nothing changed. (Follow-up: fold upload + create into one atomic call.)
    let cvUploaded = false;
    try {
      setAnalysisStep('cv');
      await uploadMyCV(cvFile);
      cvUploaded = true;
      setAnalysisStep('offer');
      const app = await createApplicationMutation.mutateAsync({
        url: jobUrl,
        interviewAt: deadline ? deadline.toISOString() : null,
      });
      setCreatedApplication(app);
    } catch (error) {
      const isThrottled =
        axios.isAxiosError(error) && error.response?.status === 429;

      if (!cvUploaded) {
        toast.error(
          extractErrorMessage(
            error,
            'CV upload failed. Try again with a higher-quality PDF (selectable text).',
          ),
        );
        return;
      }

      const cvNotice = ' Your CV has been saved to your profile.';
      toast.error(
        (isThrottled
          ? 'Too many attempts. Try again in a minute.'
          : 'Offer analysis failed. Check the link and try again.') + cvNotice,
      );
    } finally {
      setAnalysisStep('idle');
    }
  };

  /**
   * Resets the analysis workflow and clears all local states.
   * Used to allow the user to analyze another profile.
   */
  const handleReset = () => {
    setCreatedApplication(null);
    setCvFile(null);
    setJobUrl('');
    setDeadline(null);
    setDataConsentAccepted(false);
  };

  /**
   * Navigates to the application's roadmap page (F6 preparation path).
   * onStartCourse only renders once createdApplication is set; the guard is
   * for type narrowing.
   */
  const handleStartCourse = () => {
    if (!createdApplication) return;
    navigate({
      to: '/applications/$applicationId/roadmap',
      params: { applicationId: createdApplication.applicationId },
    });
  };

  return (
    <div
      className={`bg-surface flex min-h-full flex-col px-5 ${
        isFinished ? 'py-0' : 'py-6'
      }`}
    >
      {/* 1. HEADER - Hidden when results are shown */}
      {!isFinished && (
        <header className="mb-6 text-center">
          <h1 className="text-h2 text-text">Compatibility Analysis</h1>
          <p className="text-body-l text-text-weaker mt-2">
            Upload your CV and paste the job offer link to begin.
          </p>
        </header>
      )}

      {/* 2. STEP 2: AI PROCESSING OVERLAY */}
      {isAnalyzing && (
        <AIProcessingOverlay step={analysisStep === 'cv' ? 'cv' : 'offer'} />
      )}

      {/* 3. MAIN CONTENT */}
      {isFinished && createdApplication ? (
        <div className="flex flex-1 items-center justify-center">
          <AnalysisResultCard
            application={createdApplication}
            onRetry={handleReset}
            onStartCourse={handleStartCourse}
          />
        </div>
      ) : (
        <>
          <div className="mx-auto grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8">
            {/* Column 1: CV Upload & Deadline */}
            <section className="flex flex-col gap-4">
              <h2 className="text-h6 text-text">1. Your CV</h2>
              {!cvFile ? (
                <UploaderCard
                  onFileSelect={(file: File) => setCvFile(file)}
                  deadline={deadline}
                  onDeadlineChange={(date: Date | null) => setDeadline(date)}
                />
              ) : (
                <div className="bg-success-weaker border-success flex min-h-[110px] items-center gap-4 rounded-3xl border-2 p-6">
                  <div className="bg-success-weak flex h-12 w-12 items-center justify-center rounded-xl">
                    <CvIcon size={24} className="text-success" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-body-m text-text font-bold">
                      {cvFile.name}
                    </p>
                    <p className="text-body-s text-text-weaker">
                      {(cvFile.size / 1024 / 1024).toFixed(2)} MB • Ready
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="text-body-s text-error flex cursor-pointer items-center font-semibold"
                  >
                    <TrashIcon size={16} className="mr-1" />
                    Remove
                  </button>
                </div>
              )}
            </section>

            {/* Column 2: Job URL Input */}
            <section className="flex flex-col gap-4">
              <h2 className="text-h6 text-text">2. Job Offer (Link)</h2>
              <div className="bg-background border-border flex min-h-[110px] flex-col justify-center rounded-3xl border p-6">
                <label htmlFor="job-url" className="sr-only">
                  Job offer link
                </label>
                <div className="bg-surface border-border focus-within:border-accent flex items-center gap-3 rounded-xl border px-4 py-3">
                  <LinkIcon size={18} className="text-text-weakest" />
                  <input
                    id="job-url"
                    name="jobUrl"
                    type="url"
                    className="text-body-m text-text flex-1 border-none bg-transparent outline-none"
                    placeholder="Paste LinkedIn, WTTJ link..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                  />
                </div>
                <p className="text-body-s text-text-weakest mt-2.5 italic">
                  TalkUp will automatically extract details from the listing.
                </p>
              </div>
            </section>
          </div>

          {/* Action Footer */}
          <footer className="mx-auto mt-8 flex max-w-[680px] flex-col items-center gap-5 text-center">
            <div className="border-border bg-background w-full rounded-2xl border px-5 py-4 text-left">
              <div className="flex items-start gap-3">
                <CheckboxInput
                  id="data-consent"
                  name="dataConsent"
                  checked={dataConsentAccepted}
                  onChange={(event) =>
                    setDataConsentAccepted(event.target.checked)
                  }
                  className="mt-0.5 shrink-0"
                  aria-describedby="data-consent-helper"
                />
                <label
                  htmlFor="data-consent"
                  className="text-body-s text-text cursor-pointer"
                >
                  I consent to TalkUp processing my personal data (including my
                  CV) to perform this compatibility analysis.
                </label>
              </div>
              <p
                id="data-consent-helper"
                className="text-body-s text-text-weaker mt-3 pl-7"
              >
                Your data is stored securely. You can access, export, or delete
                it at any time.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={!canStart || isAnalyzing}
              className="text-button-m bg-accent hover:bg-accent-hover focus-visible:ring-accent cursor-pointer rounded-2xl px-14 py-4 text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-disabled"
            >
              Start TalkUp Analysis
            </button>
          </footer>
        </>
      )}
    </div>
  );
}
