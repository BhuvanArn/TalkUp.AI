import type { SaveStatusType } from '@/components/molecules/save-status';
import { htmlToText, textToHtml } from '@/services/notes/htmlText';
import { createNote, getUserNotes, updateNote } from '@/services/notes/http';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_CONSECUTIVE_FAILURES = 3;
const AUTOSAVE_INTERVAL_MS = 1000;
const IN_SIM_TITLE = 'Simulation notes';

/**
 * Owns the in-simulation note lifecycle: one note per interview, loaded on
 * mount and auto-upserted on a 1s timer. Inert when interviewID is null.
 */
export const useInterviewNotes = (interviewID: string | null) => {
  const [content, setContentState] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatusType>('saved');

  const noteIdRef = useRef<string | null>(null);
  const contentRef = useRef('');
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const failuresRef = useRef(0);

  const setContent = useCallback((t: string) => {
    setContentState(t);
    contentRef.current = t;
    dirtyRef.current = true;
    setSaveStatus('unsaved');
  }, []);

  // Load the interview's existing note (if any).
  useEffect(() => {
    noteIdRef.current = null;
    dirtyRef.current = false;
    failuresRef.current = 0;
    setContentState('');
    contentRef.current = '';
    if (interviewID == null) return;

    let cancelled = false;
    (async () => {
      try {
        const notes = await getUserNotes({ interviewId: interviewID });
        if (cancelled) return;
        const existing = notes[0];
        if (existing) {
          noteIdRef.current = existing.note_id;
          const text = htmlToText(existing.content);
          setContentState(text);
          contentRef.current = text;
        }
        setSaveStatus('saved');
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading interview notes:', err);
        setSaveStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      // Flush unsaved edits for the interview this effect instance was
      // loaded for, before the next run resets noteIdRef/contentRef for
      // the new interviewID. Without this, a live simulation ending
      // (interviewID -> null) mid-edit would silently drop the last
      // ~1s of unsaved content.
      if (dirtyRef.current && !savingRef.current) {
        const prevInterviewID = interviewID;
        const prevNoteId = noteIdRef.current;
        const snapshot = contentRef.current;
        // Mark clean immediately so no other cleanup/effect scheduled in
        // this same commit (e.g. the unmount-save effect below, whose
        // deps also change with interviewID) re-fires a redundant save.
        dirtyRef.current = false;
        savingRef.current = true;
        void (async () => {
          try {
            if (prevNoteId) {
              await updateNote(prevNoteId, { content: textToHtml(snapshot) });
            } else {
              await createNote({
                title: IN_SIM_TITLE,
                content: textToHtml(snapshot),
                interviewId: prevInterviewID,
              });
            }
          } catch (err) {
            console.error('Error flushing interview notes on change:', err);
          } finally {
            savingRef.current = false;
          }
        })();
      }
    };
  }, [interviewID]);

  // Core upsert, guarded by the in-flight lock.
  const doSave = useCallback(async () => {
    if (interviewID == null) return;
    if (savingRef.current) return;
    if (!dirtyRef.current) return;

    savingRef.current = true;
    setSaveStatus('saving');
    const snapshot = contentRef.current;
    try {
      if (noteIdRef.current) {
        await updateNote(noteIdRef.current, { content: textToHtml(snapshot) });
      } else {
        const created = await createNote({
          title: IN_SIM_TITLE,
          content: textToHtml(snapshot),
          interviewId: interviewID,
        });
        noteIdRef.current = created.note_id;
      }
      // Only clear dirty if no newer edit happened during the save.
      if (contentRef.current === snapshot) dirtyRef.current = false;
      failuresRef.current = 0;
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error saving interview notes:', err);
      failuresRef.current += 1;
      setSaveStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, [interviewID]);

  // 1s autosave timer; halts after MAX_CONSECUTIVE_FAILURES.
  useEffect(() => {
    if (interviewID == null) return;
    const id = setInterval(() => {
      if (failuresRef.current >= MAX_CONSECUTIVE_FAILURES) return;
      void doSave();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [interviewID, doSave]);

  // Save pending content on unmount.
  useEffect(() => {
    return () => {
      if (dirtyRef.current) void doSave();
    };
  }, [doSave]);

  // Manual save: resets the failure counter and forces one attempt.
  const saveNow = useCallback(async () => {
    failuresRef.current = 0;
    await doSave();
  }, [doSave]);

  return { content, setContent, saveStatus, saveNow };
};
