import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';

/**
 * Functional Notes Editor for interview simulations.
 * Implementation for Ticket #168: Allows users to take notes 
 * without obstructing the interview flow.
 */
const NotesEditor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');

  /**
   * Simulation of backend persistence.
   */
  const handleSaveNotes = () => {
    console.log('Notes saved:', content);
    // Ici, on pourra intégrer l'appel API plus tard
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-[350px] h-[450px] bg-white rounded-[15px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header using your 'pencil' and 'times' icons */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
                <Icon icon="pencil" className="text-primary" /> 
                <h3 className="text-xs font-bold uppercase text-gray-500">
                    Notes
                </h3>
            </div>
            <Button variant="text" size="medium" onClick={() => setIsOpen(false)}>
                <Icon icon="times" />
            </Button>
        </div>

          {/* Editor Area */}
          <textarea
            className="flex-1 p-4 text-sm text-idle focus:outline-none resize-none"
            placeholder="Type your notes during the interview..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />

          {/* Footer with 'check' and 'delete' icons */}
          <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-white">
            <Button variant="text" color="error" onClick={() => setContent('')} title="Clear">
              <Icon icon="delete" />
            </Button>
            <Button variant="outlined" size="small" onClick={handleSaveNotes}>
              <Icon icon="check" className="mr-2" />
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button using your 'edit' icon */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen ? 'bg-black' : ''
        }`}
      >
        <Icon icon={isOpen ? "times" : "edit"} className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default NotesEditor;