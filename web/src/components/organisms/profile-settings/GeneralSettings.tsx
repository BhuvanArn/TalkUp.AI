import { BaseInput } from '@/components/atoms/base-input';
import type { SelectorOption } from '@/components/atoms/selector-input';
import { TextArea } from '@/components/atoms/text-area';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { useState } from 'react';

const JOB_OPTIONS: SelectorOption[] = [
  { value: 'Product Manager Candidate', label: 'Product Manager Candidate' },
  { value: 'Product Designer', label: 'Product Designer' },
  { value: 'Software Engineer', label: 'Software Engineer' },
];

/**
 * @interface GeneralSettingsProps
 * @description Defines the configuration and event handlers for the GeneralSettings component.
 */
interface GeneralSettingsProps {
  /** User's given name */
  firstName: string;
  /** User's family name */
  lastName: string;
  /** User's professional summary or biography */
  bio: string;
  /** User's contact phone number */
  phoneNumber: string;
  /** Callback fired when the first name input value changes */
  onFirstNameChange: (value: string) => void;
  /** Callback fired when the last name input value changes */
  onLastNameChange: (value: string) => void;
  /** Callback fired when the bio textarea value changes */
  onBioChange: (value: string) => void;
  /** Callback fired when the phone number input value changes */
  onPhoneNumberChange: (value: string) => void;
}

/**
 * GeneralSettings Component
 * * Provides an interface for updating core user profile information.
 * @param {GeneralSettingsProps} props - Component properties
 * @returns {JSX.Element} The rendered general settings form
 */
export function GeneralSettings({
  firstName,
  lastName,
  bio,
  phoneNumber,
  onFirstNameChange,
  onLastNameChange,
  onBioChange,
  onPhoneNumberChange,
}: GeneralSettingsProps) {
  const [jobTitle, setJobTitle] = useState<string>(JOB_OPTIONS[0].value);
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <h3 className="mb-1 border-b border-border pb-2 text-base font-bold text-text">
          Identity
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputMolecule
            inputType="base"
            id="firstName"
            name="firstName"
            label="First name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder=""
          />
          <InputMolecule
            inputType="base"
            id="lastName"
            name="lastName"
            label="Last name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder=""
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-label-m text-idle">
            Username
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-weakest">
              @
            </span>
            <BaseInput
              id="username"
              name="username"
              value={username}
              readOnly
              className="pl-8 text-text-weaker"
              placeholder=""
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <h3 className="mb-1 border-b border-border pb-2 text-base font-bold text-text">
          About & Contact
        </h3>

        <div className="flex flex-col gap-1">
          <label htmlFor="bio" className="text-label-m text-idle">
            Bio
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
            label="Phone number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="+33 6 00 00 00 00"
          />
          <InputMolecule
            inputType="base"
            id="linkedin"
            name="linkedin"
            label="LinkedIn URL"
            value=""
            onChange={() => {}}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <InputMolecule
          inputType="selector"
          id="job-title"
          name="jobTitle"
          label="Job title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          options={JOB_OPTIONS}
        />
      </div>
    </div>
  );
}
