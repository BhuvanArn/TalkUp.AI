import { changeLanguage } from '@/i18n';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LanguageSettings } from './LanguageSettings';

const languages = [
  { name: 'English', level: 'C1', progress: 80, color: '#2B70C9' },
];

describe('LanguageSettings Component', () => {
  afterEach(async () => {
    await act(() => changeLanguage('en'));
    localStorage.clear();
  });

  it('renders the headings and tags in English', () => {
    render(<LanguageSettings languages={languages} />);
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(screen.getByText('+ Add')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
  });

  it('renders the headings and tags in French', async () => {
    await act(() => changeLanguage('fr'));
    render(<LanguageSettings languages={languages} />);
    expect(screen.getByText('Langues')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Anglais')).toBeInTheDocument();
    expect(screen.getByText('+ Ajouter')).toBeInTheDocument();
    expect(screen.getByText('Progression')).toBeInTheDocument();
  });
});
