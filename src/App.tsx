import React, { useState } from 'react';
import RichTextEditor from './components/RichTextEditor';

const App: React.FC = () => {
  const [content, setContent] = useState<string>('');

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Text Editor</h1>

      <RichTextEditor
        initialContent="<p>Hello</p>"
        onChange={setContent}
      />

      {/* <h2 className="mt-6 font-semibold">Output HTML:</h2>
      <pre className="bg-gray-100 p-4 mt-2 whitespace-pre-wrap">{content}</pre> */}
    </div>
  );
};

export default App;
