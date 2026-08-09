import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Pilcrow,
  List,
  ListOrdered,
  RemoveFormatting,
  Undo,
  Redo,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center gap-1 sm:gap-1.5 sticky top-15 z-30 shadow-2xs">
      {/* Undo & Redo */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Headings & Text Styles */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
            editor.isActive('paragraph') && !editor.isActive('heading')
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Paragraph"
        >
          <Pilcrow className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Formatting */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('underline') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Bulleted List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors ml-auto sm:ml-0"
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>
    </div>
  );
};
