import React, { useRef, useState, useEffect } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  onChange,
  placeholder = 'Type your message...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    onChange?.(editorRef.current?.innerHTML || '');
  };

  const handleInput = () => {
    onChange?.(editorRef.current?.innerHTML || '');
  };

  const insertEmojiAtCursor = (emoji: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const emojiNode = document.createTextNode(emoji);
    range.insertNode(emojiNode);

    // Move cursor after inserted emoji
    range.setStartAfter(emojiNode);
    range.setEndAfter(emojiNode);
    selection.removeAllRanges();
    selection.addRange(range);

    onChange?.(editorRef.current?.innerHTML || '');
  };

  const handleEmojiSelect = (emoji: any) => {
    insertEmojiAtCursor(emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative border rounded shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-100 rounded-t items-center">
        <button onClick={() => execCommand('bold')}><b>B</b></button>
        <button onClick={() => execCommand('italic')}><i>I</i></button>
        <button onClick={() => execCommand('underline')}><u>U</u></button>
        <button onClick={() => execCommand('insertUnorderedList')}>• List</button>

        <div className="relative">
          <button onClick={() => setShowEmojiPicker(prev => !prev)}>😀</button>
          {showEmojiPicker && (
            <div className="absolute z-10 mt-2">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" />
            </div>
          )}
        </div>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="p-4 min-h-[150px] rounded-b outline-none focus:outline-none"
        style={{
          whiteSpace: 'pre-wrap',
          cursor: 'text'
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
