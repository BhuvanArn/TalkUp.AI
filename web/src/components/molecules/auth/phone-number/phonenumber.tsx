import { cn } from '@/utils/cn';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Country, PhoneNumberInputProps } from './types';
import { usePhoneNumber } from './usePhoneNumber';

const countries: Country[] = [
  {
    code: 'US',
    flag: '🇺🇸',
    dialCode: '+1',
  },
  {
    code: 'CA',
    flag: '🇨🇦',
    dialCode: '+1',
  },
  {
    code: 'GB',
    flag: '🇬🇧',
    dialCode: '+44',
  },
  {
    code: 'DE',
    flag: '🇩🇪',
    dialCode: '+49',
  },
  {
    code: 'FR',
    flag: '🇫🇷',
    dialCode: '+33',
  },
  {
    code: 'AU',
    flag: '🇦🇺',
    dialCode: '+61',
  },
  {
    code: 'JP',
    flag: '🇯🇵',
    dialCode: '+81',
  },
  {
    code: 'CN',
    flag: '🇨🇳',
    dialCode: '+86',
  },
  {
    code: 'IN',
    flag: '🇮🇳',
    dialCode: '+91',
  },
  {
    code: 'BR',
    flag: '🇧🇷',
    dialCode: '+55',
  },
  {
    code: 'RU',
    flag: '🇷🇺',
    dialCode: '+7',
  },
  {
    code: 'ZA',
    flag: '🇿🇦',
    dialCode: '+27',
  },
  {
    code: 'MX',
    flag: '🇲🇽',
    dialCode: '+52',
  },
  {
    code: 'KR',
    flag: '🇰🇷',
    dialCode: '+82',
  },
  {
    code: 'IT',
    flag: '🇮🇹',
    dialCode: '+39',
  },
  {
    code: 'ES',
    flag: '🇪🇸',
    dialCode: '+34',
  },
  {
    code: 'NL',
    flag: '🇳🇱',
    dialCode: '+31',
  },
  {
    code: 'SE',
    flag: '🇸🇪',
    dialCode: '+46',
  },
  {
    code: 'CH',
    flag: '🇨🇭',
    dialCode: '+41',
  },
  {
    code: 'AR',
    flag: '🇦🇷',
    dialCode: '+54',
  },
];
// TODO: Replace the native <select> with the new custom selector component from create-input-molecule-component
/**
 * A reusable input component for phone numbers with country code selection.
 *
 * This component provides a combined input for phone numbers,
 * allowing users to select a country from a dropdown to automatically apply the dial code,
 * and then enter the rest of their phone number.
 *
 * @param {PhoneNumberInputProps} props - The properties for the component.
 * @param {object} [props.value] - The current value of the phone number, including countryCode and phoneNumber.
 * @param {string} [props.value.countryCode] - The ISO 2-letter country code (e.g., 'US', 'FR').
 * @param {string} [props.value.phoneNumber] - The phone number part without the dial code.
 * @param {(value: { countryCode: string; phoneNumber: string }) => void} [props.onChange] - Callback for when the value changes.
 * @param {string} [props.defaultCountryCode='US'] - The default country code to pre-select.
 * @param {string} [props.placeholder] - The placeholder text (translated 'Phone Number' by default) for the phone number input.
 * @param {string} [props.className=''] - Additional CSS classes for the main container div.
 * @param {string} [props.inputClassName=''] - Additional CSS classes for the phone number input field.
 * @param {string} [props.selectClassName=''] - Additional CSS classes for the country selector dropdown.
 * @param {boolean} [props.readOnly=false] - If true, the input fields are read-only.
 * @param {boolean} [props.disabled=false] - If true, the input fields are disabled.
 * @returns {JSX.Element} The phone number input component.
 */
const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  defaultCountryCode = 'US',
  placeholder,
  className = '',
  inputClassName = '',
  selectClassName = '',
  readOnly = false,
  disabled = false,
}) => {
  const { t } = useTranslation('auth');
  const {
    selectedCountry,
    phoneNumber,
    handleCountryChange,
    handlePhoneNumberChange,
  } = usePhoneNumber({ value, onChange, defaultCountryCode });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={selectedCountry}
        onChange={(e) => handleCountryChange(e.target.value)}
        className={cn('h-10 rounded-md border px-2', selectClassName)}
        disabled={disabled}
      >
        {countries.map(({ code, flag, dialCode }) => (
          <option key={code} value={code}>
            {flag} {t(`phoneNumber.countries.${code}`)} ({dialCode})
          </option>
        ))}
      </select>

      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => handlePhoneNumberChange(e.target.value)}
        placeholder={placeholder ?? t('phoneNumber.placeholder')}
        readOnly={readOnly}
        disabled={disabled}
        className={cn('h-10 flex-1 rounded-md border px-3', inputClassName)}
        aria-label={t('phoneNumber.label')}
      />
    </div>
  );
};
export default PhoneNumberInput;
