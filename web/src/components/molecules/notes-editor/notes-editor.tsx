import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { SaveStatus } from '@/components/molecules/save-status';
import { useInterviewNotes } from '@/hooks/notes/useInterviewNotes';
import { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';

interface NotesEditorProps {
  /** The active interview id, or null/undefined when no simulation is running. */
  interviewID?: string | null;
}

/**
 * A draggable floating editor for taking notes during simulations.
 * Persists one note per interview via useInterviewNotes.
 */
const NotesEditor = ({ interviewID }: NotesEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { content, setContent, saveStatus, saveNow } = useInterviewNotes(
    interviewID ?? null,
  );

  /** Required to avoid findDOMNode warnings in React 18 Strict Mode */
  const nodeRef = useRef(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  const handleClearNotes = () => {
    setContent('');
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <Draggable
        nodeRef={nodeRef}
        handle={isOpen ? '.drag-handle' : '.handle-button'}
      >
        <div
          ref={nodeRef}
          className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end"
        >
          {isOpen ? (
            /* Main Editor Window */
            <div className="w-[350px] h-[450px] bg-white rounded-[15px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Header: Used for dragging the window */}
              <div className="drag-handle p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 cursor-move">
                <div className="flex items-center gap-2 pointer-events-none">
                  <Icon icon="pencil" className="text-primary" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 select-none">
                    Notes
                  </h3>
                </div>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon icon="times" />
                </Button>
              </div>

              {/* Note Input */}
              <textarea
                ref={textareaRef}
                className="flex-1 p-4 text-sm text-idle focus:outline-none resize-none leading-relaxed"
                placeholder="Type here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              {/* Bottom Actions */}
              <div className="p-4 border-t border-gray-100 flex justify-between items-center gap-2 bg-white">
                <SaveStatus status={saveStatus} />
                <div className="flex gap-2">
                  <Button
                    variant="text"
                    color="error"
                    size="sm"
                    onClick={handleClearNotes}
                  >
                    <Icon icon="delete" />
                  </Button>

                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => void saveNow()}
                  >
                    <Icon icon="check" className="mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Floating Action Button (Draggable) */
            <div className="handle-button cursor-move">
              <Button
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              >
                <Icon icon="edit" className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      </Draggable>
    </div>
  );
};

export default NotesEditor;
