import { Bubble } from '@/components/atoms/bubble';
import { BubbleProps } from '@/components/atoms/bubble/types';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { ColorPicker } from '@/components/molecules/color-picker';
import { ConfirmModal } from '@/components/molecules/confirm-modal';
import { SaveStatus } from '@/components/molecules/save-status';
import { EditorToolbar } from '@/components/organisms/editor-toolbar';
import { useNoteActions } from '@/hooks/notes/useNoteActions';
import { useNoteAutoSave } from '@/hooks/notes/useNoteAutoSave';
import { useNoteData } from '@/hooks/notes/useNoteData';
import { useNoteFavorite } from '@/hooks/notes/useNoteFavorite';
import { useNoteNavigation } from '@/hooks/notes/useNoteNavigation';
import { useRichTextEditor } from '@/hooks/utils/useRichTextEditor';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import { EditorContent } from '@tiptap/react';
import { useEffect } from 'react';

export const Route = createFileRoute('/notes/$noteId')({
  beforeLoad: createAuthGuard('/notes/$noteId'),
  loader: async ({ params }) => {
    return { noteId: params.noteId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { noteId } = Route.useParams();
  const editorData = useRichTextEditor();

  const { note, setNote, isLoading } = useNoteData(noteId, !!editorData.editor);

  const { toggleFavorite } = useNoteFavorite();
  const { navigateToNotesList } = useNoteNavigation();

  const {
    isEditing,
    editedTitle,
    setEditedTitle,
    showDeleteModal,
    setShowDeleteModal,
    showColorPicker,
    setShowColorPicker,
    handleTitleEdit,
    handleTitleSave,
    handleTitleCancel,
    handleColorChange,
    handleDelete,
  } = useNoteActions(noteId, note, setNote);

  const { saveStatus, hasUnsavedChanges, saveNow } = useNoteAutoSave(
    noteId,
    note,
    editorData.editor,
    editedTitle,
  );

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !isEditing &&
        !showDeleteModal &&
        !showColorPicker
      ) {
        if (hasUnsavedChanges.current) {
          await saveNow();
        }
        navigateToNotesList();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isEditing,
    showDeleteModal,
    showColorPicker,
    navigateToNotesList,
    hasUnsavedChanges,
    saveNow,
  ]);

  const handleToggleFavorite = async () => {
    if (!note) return;

    await toggleFavorite(noteId, note.is_favorite, (newStatus) => {
      setNote({ ...note, is_favorite: newStatus });
    });
  };

  const handleDeleteNote = async () => {
    const success = await handleDelete();
    if (success) {
      navigateToNotesList();
    }
  };

  if (isLoading || !editorData.editor || !note) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div
            className="loader"
            style={{
              width: '48px',
              height: '48px',
              borderWidth: '4px',
              margin: '0 auto 16px',
            }}
          />
          <p className="text-text-idle">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[96px_1fr] px-4 sm:px-8 md:px-16 pt-11 gap-11 h-screen w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center w-full min-w-0 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title="Change note color"
              >
                <Bubble size="md" color={note.color as BubbleProps['color']} />
              </button>
              <ColorPicker
                currentColor={note.color as BubbleProps['color']}
                onColorSelect={handleColorChange}
                onClose={() => setShowColorPicker(false)}
                isOpen={showColorPicker}
              />
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') {
                      handleTitleCancel();
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="text-h1 text-text-idle bg-transparent border-b-2 border-accent focus:outline-none"
                />
                <Button
                  variant="text"
                  color="accent"
                  className="p-2"
                  onClick={handleTitleSave}
                  title="Save title"
                >
                  <Icon icon="check" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-h1 text-text-idle border-b-2 border-white">
                  {note.title}
                </h1>
                <Button
                  variant="text"
                  color="black"
                  className="p-2"
                  title="Edit note name"
                  onClick={handleTitleEdit}
                >
                  <Icon icon="pencil" />
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <SaveStatus status={saveStatus} />
            <div className="h-6 w-px bg-border mx-2" />
            <Button variant="text" color="black" title="Share note">
              <Icon icon="share" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="text"
              color={note.is_favorite ? 'accent' : 'black'}
              title={
                note.is_favorite ? 'Remove from favorites' : 'Add to favorites'
              }
              onClick={handleToggleFavorite}
            >
              <Icon icon={note.is_favorite ? 'bookmark-filled' : 'bookmark'} />
              <span className="hidden sm:inline">
                {note.is_favorite ? 'Favorited' : 'Favorite'}
              </span>
            </Button>
            <Button
              variant="text"
              color="error"
              title="Delete note"
              onClick={() => setShowDeleteModal(true)}
            >
              <Icon icon="delete" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
        <p className="text-text-idle text-body-md mt-2">
          Last updated {new Date(note.updated_at).toLocaleString()}
        </p>
      </div>
      <div className="grid grid-rows-[40px_1fr] bg-note-card rounded-t-[20px] px-6 pt-4 pb-0 gap-3 w-full min-w-0 h-full overflow-hidden">
        <div className="bg-white rounded-[10px] w-full min-w-0">
          <EditorToolbar {...editorData} />
        </div>
        <div className="bg-white rounded-t-[10px] w-full min-w-0 overflow-y-auto p-6">
          <EditorContent editor={editorData.editor} />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="error"
        icon="trash"
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDeleteNote();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
