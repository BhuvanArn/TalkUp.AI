import { BaseInput } from '@/components/atoms/base-input';
import type { SelectorOption } from '@/components/atoms/selector-input';
import { TextArea } from '@/components/atoms/text-area';
import { InputMolecule } from '@/components/molecules/input-molecule';
import type { ParseKeys } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/** Job titles offered in the selector. `value` is what the profile stores. */
const JOB_OPTIONS = [
  {
    value: 'Product Manager Candidate',
    labelKey: 'generalSettings.jobOptions.productManagerCandidate',
  },
  {
    value: 'Product Designer',
    labelKey: 'generalSettings.jobOptions.productDesigner',
  },
  {
    value: 'Software Engineer',
    labelKey: 'generalSettings.jobOptions.softwareEngineer',
  },
] as const satisfies readonly {
  value: string;
  labelKey: ParseKeys<'settings'>;
}[];

/**
 * @interface GeneralSettingsProps
 * @description Defines the configuration and event handlers for the GeneralSettings component.
 */
interface GeneralSettingsProps {
  /** Login / account handle (read-only) */
  accountUsername: string;
  /** User's given name */
  firstName: string;
  /** User's family name */
  lastName: string;
  /** User's professional summary or biography */
  bio: string;
  /** User's contact phone number */
  phoneNumber: string;
  linkedinUrl: string;
  jobTitle: string;
  /** Callback fired when the first name input value changes */
  onFirstNameChange: (value: string) => void;
  /** Callback fired when the last name input value changes */
  onLastNameChange: (value: string) => void;
  /** Callback fired when the bio textarea value changes */
  onBioChange: (value: string) => void;
  /** Callback fired when the phone number input value changes */
  onPhoneNumberChange: (value: string) => void;
  onLinkedinUrlChange: (value: string) => void;
  onJobTitleChange: (value: string) => void;
}

/**
 * GeneralSettings Component
 * * Provides an interface for updating core user profile information.
 * @param {GeneralSettingsProps} props - Component properties
 * @returns {JSX.Element} The rendered general settings form
 */
export function GeneralSettings({
  accountUsername,
  firstName,
  lastName,
  bio,
  phoneNumber,
  linkedinUrl,
  jobTitle,
  onFirstNameChange,
  onLastNameChange,
  onBioChange,
  onPhoneNumberChange,
  onLinkedinUrlChange,
  onJobTitleChange,
}: GeneralSettingsProps) {
  const { t } = useTranslation('settings');
  const jobOptions = useMemo((): SelectorOption[] => {
    const options = JOB_OPTIONS.map(({ value, labelKey }) => ({
      value,
      label: t(labelKey),
    }));
    if (!jobTitle || options.some((o) => o.value === jobTitle)) {
      return options;
    }
    return [{ value: jobTitle, label: jobTitle }, ...options];
  }, [jobTitle, t]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <h3 className="mb-1 border-b border-border pb-2 text-base font-bold text-text">
          {t('generalSettings.identity')}
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputMolecule
            inputType="base"
            id="firstName"
            name="firstName"
            label={t('generalSettings.firstName')}
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder=""
          />
          <InputMolecule
            inputType="base"
            id="lastName"
            name="lastName"
            label={t('generalSettings.lastName')}
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder=""
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-label-m text-idle">
            {t('generalSettings.username')}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-weakest">
              @
            </span>
            <BaseInput
              id="username"
              name="username"
              value={accountUsername}
              readOnly
              className="pl-8 text-text-weaker"
              placeholder=""
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <h3 className="mb-1 border-b border-border pb-2 text-base font-bold text-text">
          {t('generalSettings.aboutContact')}
        </h3>

        <div className="flex flex-col gap-1">
          <label htmlFor="bio" className="text-label-m text-idle">
            {t('generalSettings.bio')}
          </label>
          <TextArea
            id="bio"
            name="bio"
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            maxLength={300}
            rows={4}
            placeholder=""
          />
          <p className="mt-1 text-xs text-text-weakest">{`${bio.length} / 300`}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputMolecule
            inputType="base"
            id="phone"
            name="phone"
            label={t('generalSettings.phone')}
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="+33 6 00 00 00 00"
          />
          <InputMolecule
            inputType="base"
            id="linkedin"
            name="linkedin"
            label={t('generalSettings.linkedin')}
            value={linkedinUrl}
            onChange={(e) => onLinkedinUrlChange(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <InputMolecule
          inputType="selector"
          id="job-title"
          name="jobTitle"
          label={t('generalSettings.jobTitle')}
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
          options={jobOptions}
        />
      </div>
    </div>
  );
}
