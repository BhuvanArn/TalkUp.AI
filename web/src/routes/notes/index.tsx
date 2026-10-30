import { BubbleProps } from '@/components/atoms/bubble/types';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { AddNoteCard } from '@/components/molecules/add-note-card';
import { EmptyState } from '@/components/molecules/empty-state';
import { NoteCard } from '@/components/organisms/note-card';
import type { NoteCardBadge } from '@/components/organisms/note-card/types';
import { useLocale } from '@/hooks/i18n/useLocale';
import { useNoteCreation } from '@/hooks/notes/useNoteCreation';
import { useNoteFavorite } from '@/hooks/notes/useNoteFavorite';
import { useNoteNavigation } from '@/hooks/notes/useNoteNavigation';
import { useNotesList } from '@/hooks/notes/useNotesList';
import { useApplications } from '@/services/applications/hooks';
import { type Note, type NoteKind, getNoteKind } from '@/services/notes/types';
import { createAuthGuard } from '@/utils/auth.guards';
import { formatJobAtCompany } from '@/utils/jobAtCompany';
import { Link, createFileRoute } from '@tanstack/react-router';
import type { ParseKeys } from 'i18next';
import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export interface NotesSearch {
  applicationId?: string;
}

export const Route = createFileRoute('/notes/')({
  // Optional application scope from the roadmap "My notes" deep-link.
  validateSearch: (search: Record<string, unknown>): NotesSearch => ({
    applicationId:
      typeof search.applicationId === 'string'
        ? search.applicationId
        : undefined,
  }),
  beforeLoad: createAuthGuard('/notes'),
  component: Notes,
});

type KindFilter = 'all' | NoteKind;

const FILTERS: { key: KindFilter; labelKey: ParseKeys<'app'> }[] = [
  { key: 'all', labelKey: 'notes.filters.all' },
  { key: 'general', labelKey: 'notes.filters.general' },
  { key: 'application', labelKey: 'notes.filters.application' },
  { key: 'simulation', labelKey: 'notes.filters.simulation' },
];

/** Human date for a note's simulation/creation moment. */
const formatDate = (iso: string, intlLocale: string) =>
  new Date(iso).toLocaleDateString(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export function Notes() {
  const { t } = useTranslation(['app', 'common']);
  const { intlLocale } = useLocale();
  const { applicationId } = Route.useSearch();
  const {
    notes,
    isLoading,
    error,
    setError,
    addNote,
    updateNoteInList,
    revertNoteInList,
  } = useNotesList(applicationId);

  // Applications drive the badge labels (company/role) for application- and
  // simulation-scoped notes. Cheap, cached, and absent-tolerant.
  const { data: applications } = useApplications();
  const appLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of applications ?? []) {
      const label = formatJobAtCompany(app.jobTitle, app.companyName);
      map.set(app.applicationId, label || t('notes.thisApplication'));
    }
    return map;
  }, [applications, t]);

  const [filter, setFilter] = useState<KindFilter>('all');

  // In an application-scoped view the fetch only ever returns that
  // application's application- and simulation-notes, so a "General" chip could
  // never match — drop it to avoid a filter that always yields the empty state.
  const filters = applicationId
    ? FILTERS.filter((f) => f.key !== 'general')
    : FILTERS;

  const { toggleFavorite } = useNoteFavorite();
  const { navigateToNote } = useNoteNavigation();
  const { createNewNote } = useNoteCreation();

  const scopedAppLabel = applicationId
    ? appLabelById.get(applicationId)
    : undefined;

  const visibleNotes =
    filter === 'all' ? notes : notes.filter((n) => getNoteKind(n) === filter);

  const badgeFor = (note: Note): NoteCardBadge | undefined => {
    const kind = getNoteKind(note);
    if (kind === 'general') return undefined;
    const appLabel = note.application_id
      ? appLabelById.get(note.application_id)
      : undefined;
    if (kind === 'simulation') {
      return {
        label: t('notes.badges.simulation'),
        tone: 'simulation',
        // created_at is when the note was written during the simulation.
        sublabel: [appLabel, formatDate(note.created_at, intlLocale)]
          .filter(Boolean)
          .join(' · '),
      };
    }
    return {
      label: t('notes.badges.application'),
      tone: 'application',
      sublabel: appLabel,
    };
  };

  const handleToggleFavorite = async (id: string) => {
    const note = notes.find((n) => n.note_id === id);
    if (!note) return;

    updateNoteInList(id, { is_favorite: !note.is_favorite });

    await toggleFavorite(id, note.is_favorite, undefined, () => {
      revertNoteInList(id, note);
    });
  };

  const handleAddNewNote = async () => {
    try {
      // When viewing an application's notes, a new note is scoped to it.
      const newNote = await createNewNote(applicationId);
      if (newNote) {
        addNote(newNote);
        navigateToNote(newNote.note_id);
      }
    } catch {
      setError('notes.errors.create');
    }
  };

  return (
    <div className="grid grid-rows-[auto_1fr] px-4 sm:px-8 md:px-16 pt-11 gap-6 h-screen w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col justify-center gap-4">
        <div className="flex justify-between items-center w-full min-w-0 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-h1 text-text-idle">{t('notes.title')}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="text"
              color="black"
              title={t('notes.addNote')}
              onClick={handleAddNewNote}
            >
              <Icon icon="plus" />
              <span className="hidden sm:inline">{t('notes.addNote')}</span>
            </Button>
          </div>
        </div>

        {applicationId ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-body-m text-text-weak">
              {/* The label is user data: pass it as a child, never in `values`. */}
              <Trans
                ns="app"
                i18nKey="notes.showingFor"
                components={{
                  application: (
                    <span className="font-semibold text-text-idle">
                      {scopedAppLabel ?? t('notes.thisApplication')}
                    </span>
                  ),
                }}
              />
            </span>
            <Link
              to="/notes"
              className="text-button-m text-accent hover:text-accent-hover inline-flex items-center gap-1"
            >
              <Icon icon="arrow-left" className="w-4 h-4" aria-hidden="true" />
              {t('notes.backToAll')}
            </Link>
          </div>
        ) : (
          <p className="text-text-idle">{t('notes.subtitle')}</p>
        )}

        {/* Kind filter. Application scope is applied server-side; these chips
            narrow the fetched set by note kind (client-side). */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.key)}
                className={`text-body-s rounded-full border px-4 py-1.5 transition-colors ${
                  active
                    ? 'border-accent bg-accent text-white'
                    : 'border-border text-text-weak hover:border-accent hover:text-accent'
                }`}
              >
                {t(f.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-full min-w-0 h-full overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-weaker">{t('notes.loading')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-error mb-4">{t(error)}</p>
            <Button
              variant="contained"
              color="accent"
              onClick={() => window.location.reload()}
            >
              {t('common:actions.retry')}
            </Button>
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            icon="notes"
            title={t('notes.empty.title')}
            description={t('notes.empty.description')}
            actionLabel={t('notes.empty.cta')}
            onAction={handleAddNewNote}
          />
        ) : visibleNotes.length === 0 ? (
          <EmptyState
            icon="notes"
            title={t('notes.emptyFilter.title')}
            description={t('notes.emptyFilter.description')}
            actionLabel={t('notes.emptyFilter.cta')}
            onAction={() => setFilter('all')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-min pb-6">
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.note_id}
                id={note.note_id}
                title={note.title}
                preview={note.content}
                color={note.color as BubbleProps['color']}
                lastUpdatedAt={new Date(note.updated_at)}
                isFavorite={note.is_favorite}
                badge={badgeFor(note)}
                onToggleFavorite={handleToggleFavorite}
                onClick={navigateToNote}
              />
            ))}
            <AddNoteCard onClick={handleAddNewNote} />
          </div>
        )}
      </div>
    </div>
  );
}
