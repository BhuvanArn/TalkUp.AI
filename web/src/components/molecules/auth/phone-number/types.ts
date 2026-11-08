import type { ParseKeys } from 'i18next';

type CountryCodeOf<K> = K extends `phoneNumber.countries.${infer C}`
  ? C
  : never;

/**
 * ISO 2-letter code of a country named under `phoneNumber.countries` in the
 * `auth` namespace. A code without a translated name fails to type-check.
 */
export type CountryCode = CountryCodeOf<ParseKeys<'auth'>>;

/**
 * Represents a country with its details for phone number input.
 */
export interface Country {
  /** ISO 2-letter code (e.g., 'US'), named by `phoneNumber.countries.<code>`. */
  code: CountryCode;
  /** Emoji flag. */
  flag: string;
  /** International dial code (e.g., '+1'). */
  dialCode: string;
}

/**
 * Defines the structure for a phone number's value.
 */
export type PhoneNumberValue = {
  /** The ISO 2-letter country code. */
  countryCode: string;
  /** The phone number without the dial code. */
  phoneNumber: string;
};

/**
 * Props for the PhoneNumberInput component.
 */
export interface PhoneNumberInputProps {
  /** Current phone number value. */
  value?: PhoneNumberValue;
  /** Callback on value change. */
  onChange?: (value: PhoneNumberValue) => void;
  /** Default selected country code (e.g., 'US'). */
  defaultCountryCode?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
  readOnly?: boolean;
  disabled?: boolean;
}
