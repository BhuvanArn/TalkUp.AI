import { LANGUAGE_STORAGE_KEY, changeLanguage } from '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

import LanguageSwitcher from './index';

const EN_NAME = 'FR Switch to Français (current language: English)';
// No-break space before the colon, as in the French translation.
const FR_NAME = 'EN Passer en English (langue actuelle : Français)';

describe('LanguageSwitcher', () => {
  afterEach(async () => {
    // setupTests pins English for every other test.
    await act(() => i18next.changeLanguage('en'));
    localStorage.clear();
  });

  it('offers French and announces English as current', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button', { name: EN_NAME });
    expect(button).not.toHaveAttribute('aria-label');
    expect(button).toHaveTextContent(/^FR/);
  });

  it('marks the target language name with its own lang', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByText('Français')).toHaveAttribute('lang', 'fr');
    expect(screen.getByText('FR')).toHaveAttribute('lang', 'fr');
  });

  it('switches to French, updates <html lang> and saves the choice', async () => {
    render(<LanguageSwitcher />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(i18next.language).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(screen.getByRole('button', { name: FR_NAME })).toHaveTextContent(
      /^EN/,
    );
    expect(screen.getByText('English')).toHaveAttribute('lang', 'en');
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

    expect(screen.getByRole('menuitem', { name: EN_NAME })).toBeInTheDocument();
  });

  describe('unstyled', () => {
    it('renders a plain button with only the given classes', () => {
      render(<LanguageSwitcher unstyled className="menu-button" />);

      const button = screen.getByRole('button', { name: EN_NAME });
      expect(button).toHaveAttribute('class', 'menu-button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('still switches the language', async () => {
      render(<LanguageSwitcher unstyled role="menuitem" />);

      await act(async () => {
        fireEvent.click(screen.getByRole('menuitem'));
      });

      expect(i18next.language).toBe('fr');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    });
  });
});
