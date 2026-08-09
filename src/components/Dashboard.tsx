import React, { useState } from 'react';
import { Document, User, DocumentFilter } from '../types';
import { DocumentCard } from './DocumentCard';
import { Search, Plus, Upload, FolderKanban, Users, FileText, Sparkles, Filter } from 'lucide-react';

interface DashboardProps {
  ownedDocuments: Document[];
  sharedDocuments: Document[];
  currentUser: User | null;
  onCreateNewDocument: () => void;
  onOpenUploadModal: () => void;
  onOpenDocument: (docId: string) => void;
  onRenameDocument: (doc: Document) => void;
  onShareDocument: (doc: Document) => void;
  onDeleteDocument: (docId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  ownedDocuments,
  sharedDocuments,
  currentUser,
  onCreateNewDocument,
  onOpenUploadModal,
  onOpenDocument,
  onRenameDocument,
  onShareDocument,
  onDeleteDocument,
}) => {
  const [filter, setFilter] = useState<DocumentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allDocuments = [...ownedDocuments, ...sharedDocuments];

  // Filter documents
  const filteredDocuments = allDocuments.filter((doc) => {
    // Category filter
    if (filter === 'owned' && doc.ownerId !== currentUser?.id) return false;
    if (filter === 'shared' && doc.ownerId === currentUser?.id) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchOwner = doc.owner?.name.toLowerCase().includes(q);
      return matchTitle || matchOwner;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Stats Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Workspace Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name || 'User'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Collaborate seamlessly on rich text documents, import Word/Markdown files, and share specs with team members.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center gap-2 backdrop-blur-xs"
            >
              <Upload className="w-4 h-4 text-indigo-300" />
              <span>Import File</span>
            </button>
            <button
              onClick={onCreateNewDocument}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Document</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6 pt-6 border-t border-slate-800/80 text-left">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Docs</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{allDocuments.length}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Owned by You</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">{ownedDocuments.length}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Shared with You</div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-400 mt-0.5">{sharedDocuments.length}</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Category Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
          <button
            id="tab-filter-all"
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>All Documents ({allDocuments.length})</span>
          </button>

          <button
            id="tab-filter-owned"
            onClick={() => setFilter('owned')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'owned'
                ? 'bg-white text-emerald-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Documents ({ownedDocuments.length})</span>
          </button>

          <button
            id="tab-filter-shared"
            onClick={() => setFilter('shared')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'shared'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Shared with me ({sharedDocuments.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles or owners..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              currentUser={currentUser}
              onOpen={onOpenDocument}
              onRename={onRenameDocument}
              onShare={onShareDocument}
              onDelete={onDeleteDocument}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {searchQuery
              ? `No matching documents for "${searchQuery}". Try clearing search keywords.`
              : filter === 'shared'
              ? 'No documents have been shared with you yet. Switch users using the header dropdown to share documents across team accounts.'
              : 'You have not created any documents yet.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={onCreateNewDocument}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Blank Document</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
