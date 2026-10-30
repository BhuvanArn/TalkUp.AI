import { LANGUAGE_STORAGE_KEY, changeLanguage } from '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

import LanguageSwitcher from './index';

describe('LanguageSwitcher', () => {
  afterEach(async () => {
    // setupTests pins English for every other test.
    await act(() => i18next.changeLanguage('en'));
    localStorage.clear();
  });

  it('offers French and announces English as current', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button', {
      name: 'Current language: English. Switch to Français (FR)',
    });
    expect(button).toHaveTextContent('FR');
  });

  it('switches to French, updates <html lang> and saves the choice', async () => {
    render(<LanguageSwitcher />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(i18next.language).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(
      screen.getByRole('button', {
        name: 'Langue actuelle : Français. Passer en English (EN)',
      }),
    ).toHaveTextContent('EN');
  });

  it('switches back to English', async () => {
    await act(() => changeLanguage('fr'));
    render(<LanguageSwitcher />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(i18next.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('accepts a role override for menus', () => {
    render(<LanguageSwitcher role="menuitem" />);

    expect(screen.getByRole('menuitem')).toBeInTheDocument();
  });
});
