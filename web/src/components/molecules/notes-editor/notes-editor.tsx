import { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';

const NotesEditor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const nodeRef = useRef(null);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <Draggable 
        nodeRef={nodeRef} 
        handle={isOpen ? ".drag-handle" : ".handle-button"}
      >
        <div 
          ref={nodeRef} 
          className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end"
        >
          {isOpen ? (
            <div className="w-[350px] h-[450px] bg-white rounded-[15px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="drag-handle p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 cursor-move">
                <div className="flex items-center gap-2 pointer-events-none">
                  <Icon icon="pencil" className="text-primary" /> 
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 select-none">
                    Interview Notes
                  </h3>
                </div>
                <Button variant="text" size="s" onClick={() => setIsOpen(false)}>
                  <Icon icon="times" />
                </Button>
              </div>

              <textarea
                className="flex-1 p-4 text-sm text-idle focus:outline-none resize-none"
                placeholder="Type your notes..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
              />

              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-white">
                <Button variant="outlined" size="s" onClick={() => console.log(content)}>
                  <Icon icon="check" className="mr-2" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="handle-button cursor-move">
              <Button
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
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