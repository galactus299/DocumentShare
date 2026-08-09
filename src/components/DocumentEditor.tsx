import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Document, User } from '../types';
import { updateDocument } from '../lib/api';
import {
  downloadFile,
  tiptapJsonToPlainText,
  tiptapJsonToMarkdown,
} from '../lib/utils';
import { EditorToolbar } from './EditorToolbar';
import {
  ArrowLeft,
  CheckCircle2,
  Share2,
  Download,
  Save,
  FileCode,
  FileText,
  FileSpreadsheet,
  Globe,
  Eye,
  Edit3,
} from 'lucide-react';

interface DocumentEditorProps {
  document: Document;
  currentUser: User | null;
  users: User[];
  onBackToDashboard: () => void;
  onOpenShareModal: (doc: Document) => void;
  onDocumentUpdated: (doc: Document) => void;
  onOpenAuthModal?: (tab: 'login' | 'signup') => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document: initialDoc,
  currentUser,
  onBackToDashboard,
  onOpenShareModal,
  onDocumentUpdated,
  onOpenAuthModal,
}) => {
  const [docTitle, setDocTitle] = useState(initialDoc.title);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isOwner = currentUser?.id === initialDoc.ownerId;
  const isReadOnly = initialDoc.userAccessLevel === 'view' && !isOwner;

  // Sync title if doc changes externally
  useEffect(() => {
    setDocTitle(initialDoc.title);
  }, [initialDoc.title]);

  // Handle Export dropdown click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract query token if available
  const getQueryToken = () => {
    try {
      const match = window.location.hash.match(/token=([^&]+)/) || window.location.search.match(/token=([^&]+)/);
      return match ? match[1] : initialDoc.publicToken;
    } catch {
      return initialDoc.publicToken;
    }
  };

  // Save content to backend
  const saveContent = useCallback(
    async (titleToSave: string, jsonContent: any) => {
      if (isReadOnly) return;
      try {
        setSaveState('saving');
        const updated = await updateDocument(
          initialDoc.id,
          { title: titleToSave, content: jsonContent },
          currentUser?.id,
          getQueryToken()
        );
        onDocumentUpdated(updated);
        setSaveState('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveState('unsaved');
      }
    },
    [initialDoc.id, currentUser?.id, isReadOnly, onDocumentUpdated]
  );

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialDoc.content,
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class:
          'focus:outline-none min-h-[500px] p-8 sm:p-12 text-slate-800 text-sm leading-relaxed max-w-none prose prose-slate focus:prose-indigo',
      },
    },
    onUpdate: ({ editor }) => {
      if (isReadOnly) return;
      setSaveState('saving');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        const json = editor.getJSON();
        saveContent(docTitle, json);
      }, 800);
    },
  });

  // Keep editor editable state in sync
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [editor, isReadOnly]);

  // Handle Title Blur or Enter
  const handleTitleBlur = () => {
    if (isReadOnly) return;
    if (docTitle !== initialDoc.title) {
      const json = editor ? editor.getJSON() : initialDoc.content;
      saveContent(docTitle, json);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  // Manual save trigger
  const handleManualSave = () => {
    if (editor && !isReadOnly) {
      saveContent(docTitle, editor.getJSON());
    }
  };

  // Export handlers
  const handleExportTxt = () => {
    if (!editor) return;
    const plainText = tiptapJsonToPlainText(editor.getJSON());
    downloadFile(`${docTitle.toLowerCase().replace(/\s+/g, '_')}.txt`, plainText, 'text/plain;charset=utf-8');
    setExportMenuOpen(false);
  };

  const handleExportMd = () => {
    if (!editor) return;
    const markdown = tiptapJsonToMarkdown(editor.getJSON());
    downloadFile(`${docTitle.toLowerCase().replace(/\s+/g, '_')}.md`, markdown, 'text/markdown;charset=utf-8');
    setExportMenuOpen(false);
  };

  const handleExportHtml = () => {
    if (!editor) return;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${docTitle}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-w: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
  h1 { font-size: 2.25rem; font-weight: 800; }
  h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5em; }
</style>
</head>
<body>
${editor.getHTML()}
</body>
</html>`;
    downloadFile(`${docTitle.toLowerCase().replace(/\s+/g, '_')}.html`, htmlContent, 'text/html;charset=utf-8');
    setExportMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col pb-16">
      {/* Public Share Banner if accessing publicly */}
      {initialDoc.isPublicAccess && (
        <div
          className={`px-4 py-2 text-xs font-medium flex items-center justify-between border-b ${
            isReadOnly
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Globe className="w-4 h-4 shrink-0" />
            <span>
              {isReadOnly ? (
                <>
                  <strong>Public Link — Read-Only Mode.</strong> You are viewing this document via a public share link.
                </>
              ) : (
                <>
                  <strong>Public Link — Live Editing Enabled.</strong> You are editing this document via a public share link.
                </>
              )}
            </span>
          </div>

          {!currentUser && onOpenAuthModal && (
            <button
              onClick={() => onOpenAuthModal('signup')}
              className="px-3 py-1 bg-white border border-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-slate-50 transition-colors shrink-0 text-[11px]"
            >
              Sign Up / Log In
            </button>
          )}
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 h-15 flex items-center justify-between gap-4 sticky top-15 z-40 shadow-xs">
        {/* Left: Back button & Title field */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0 flex-1 max-w-xl">
            <input
              type="text"
              value={docTitle}
              disabled={isReadOnly}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              placeholder="Untitled document"
              className={`text-base font-bold text-slate-900 bg-transparent border-b border-transparent ${
                isReadOnly ? 'cursor-default' : 'hover:border-slate-300 focus:border-indigo-500 focus:bg-slate-50/80'
              } rounded-sm px-1.5 py-0.5 transition-all outline-none truncate`}
            />
            <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500 mt-0.5">
              <span>Owned by {initialDoc.owner?.name || 'Workspace User'}</span>
              <span>&bull;</span>
              {isOwner ? (
                <span className="text-emerald-600 font-semibold">Owner</span>
              ) : isReadOnly ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <Eye className="w-3 h-3 inline" /> Read Only
                </span>
              ) : (
                <span className="text-indigo-600 font-semibold flex items-center gap-1">
                  <Edit3 className="w-3 h-3 inline" /> Can Edit
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Autosave Status, Manual Save, Share, Export */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!isReadOnly && (
            <>
              {/* Status Indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/60">
                {saveState === 'saving' ? (
                  <>
                    <span className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent" />
                    <span className="text-indigo-600">Saving...</span>
                  </>
                ) : saveState === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-slate-600">Saved</span>
                  </>
                ) : (
                  <span className="text-amber-600">Unsaved changes</span>
                )}
              </div>

              {/* Manual Save Button */}
              <button
                onClick={handleManualSave}
                className="p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5"
                title="Force save changes"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>
            </>
          )}

          {/* Share Button (Owner Only) */}
          {isOwner && (
            <button
              onClick={() => onOpenShareModal(initialDoc)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
              {initialDoc.shares && initialDoc.shares.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-800 text-indigo-100 font-bold">
                  {initialDoc.shares.length}
                </span>
              )}
            </button>
          )}

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
              title="Export document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Download As
                </div>
                <button
                  onClick={handleExportTxt}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Plain Text (.txt)</span>
                </button>
                <button
                  onClick={handleExportMd}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  <span>Markdown (.md)</span>
                </button>
                <button
                  onClick={handleExportHtml}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>HTML (.html)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Formatting Toolbar */}
      {!isReadOnly && <EditorToolbar editor={editor} />}

      {/* Document Sheet Canvas */}
      <main className="max-w-4xl w-full mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden transition-all min-h-[650px]">
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  );
};
