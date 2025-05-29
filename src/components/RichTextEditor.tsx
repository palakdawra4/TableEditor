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
  const [sentMessage, setSentMessage] = useState<string>('');
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const insertSymbol = (symbol: string) => {
  const selection = window.getSelection();
  if (!selection || !editorRef.current) return;
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (selectedText.length > 0) {
    const newNode = document.createTextNode(`${symbol}${selectedText}${symbol}`);
    range.deleteContents();
    range.insertNode(newNode);
  } else {
    const marker = document.createTextNode(symbol);
    range.insertNode(marker);
    range.setStartAfter(marker);
    range.setEndAfter(marker);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

  const insertEmojiAtCursor = (emoji: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const emojiNode = document.createTextNode(emoji);
    range.insertNode(emojiNode);
    range.setStartAfter(emojiNode);
    range.setEndAfter(emojiNode);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const toggleBulletList = () => {
    document.execCommand('insertUnorderedList');
    setIsBulletList(prev => {
      const newState = !prev;
      if (newState) setIsNumberedList(false);
      return newState;
    });
  };

  const toggleNumberedList = () => {
    document.execCommand('insertOrderedList');
    setIsNumberedList(prev => {
      const newState = !prev;
      if (newState) setIsBulletList(false);
      return newState;
    });
  };

  // ✅ Parses markdown-like symbols to HTML tags
 const parseMarkdownInHTML = (htmlString: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Helper function to recursively process nodes and replace markdown in text nodes
  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent || '';
      // Replace markdown symbols in text nodes only
      text = text
        .replace(/\*([^*]+)\*/g, '<b>$1</b>')  // *bold*
        .replace(/_([^_]+)_/g, '<i>$1</i>')    // _italic_
        .replace(/~([^~]+)~/g, '<s>$1</s>');   // ~strike~
      
      // Create a temporary container to parse replaced html tags in string
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;

      // Replace the original text node with parsed HTML nodes
      if (tempDiv.childNodes.length === 1 && tempDiv.childNodes[0].nodeType === Node.TEXT_NODE) {
        node.textContent = tempDiv.textContent;
      } else {
        const parent = node.parentNode;
        if (!parent) return;
        while (tempDiv.firstChild) {
          parent.insertBefore(tempDiv.firstChild, node);
        }
        parent.removeChild(node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.childNodes.forEach(child => walkNodes(child));
    }
  };

  walkNodes(doc.body);

  // Return the innerHTML preserving all tags, lists, and line breaks
  return doc.body.innerHTML;
};



  // ✅ Force paste as plain text (to preserve markdown symbols)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      // Browser handles Enter inside lists
    }
  };

  const handleSend = () => {
    if (!editorRef.current) return;
    let rawHTML = editorRef.current.innerHTML;

    // Clean up unwanted characters
    rawHTML = rawHTML
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/\u00A0/g, ' ')
      .replace(/\u200B/g, '')
      .replace(/[\u2212\u2013\u2014]/g, '-');

    const parsedHTML = parseMarkdownInHTML(rawHTML);
    setSentMessage(parsedHTML);
    editorRef.current.innerHTML = '';
    setIsBulletList(false);
    setIsNumberedList(false);
    if (onChange) onChange(parsedHTML);
  };

  return (
    <div className="relative border rounded shadow-sm p-4 space-y-4">
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-100 rounded-t items-center">
        <button onClick={() => insertSymbol('*')}><b>B</b></button>
        <button onClick={() => insertSymbol('_')}><i>I</i></button>
        <button onClick={() => insertSymbol('~')}><s>S</s></button>

        <button
          onClick={toggleBulletList}
          style={{ fontWeight: isBulletList ? 'bold' : 'normal', backgroundColor: isBulletList ? '#ddd' : 'transparent' }}
          type="button"
        >
          • List
        </button>
        <button
          onClick={toggleNumberedList}
          style={{ fontWeight: isNumberedList ? 'bold' : 'normal', backgroundColor: isNumberedList ? '#ddd' : 'transparent' }}
          type="button"
        >
          1. List
        </button>

        <div className="relative">
          <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)}>😀</button>
          {showEmojiPicker && (
            <div className="absolute z-10 mt-2">
              <Picker
                data={data}
                onEmojiSelect={(e: any) => {
                  insertEmojiAtCursor(e.native);
                  setShowEmojiPicker(false);
                }}
                theme="light"
              />
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onPaste={handlePaste} // ✅ PASTE HANDLING ADDED HERE
        className="p-4 min-h-[150px] border rounded outline-none focus:outline-none whitespace-pre-wrap"
        data-placeholder={placeholder}
        style={{ whiteSpace: 'pre-wrap', cursor: 'text' }}
      />

      <button
        onClick={handleSend}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        type="button"
      >
        Send
      </button>

      {sentMessage && (
        <div>
        <div className="border-t pt-4">
          <h2 className="font-semibold mb-2">Sent Message:</h2>
          <div
            className="p-4 border rounded bg-gray-50"
            dangerouslySetInnerHTML={{ __html: sentMessage }}
          />
        </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;