import React, { useState, useRef, useEffect } from 'react';
import { Document, User } from '../types';
import { formatRelativeTime } from '../lib/utils';
import { FileText, MoreVertical, Share2, Edit3, Trash2, Users, ArrowUpRight } from 'lucide-react';

interface DocumentCardProps {
  document: Document;
  currentUser: User | null;
  onOpen: (docId: string) => void;
  onRename: (doc: Document) => void;
  onShare: (doc: Document) => void;
  onDelete: (docId: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  currentUser,
  onOpen,
  onRename,
  onShare,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser?.id === doc.ownerId;
  const shareCount = doc.shares?.length || 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div
      id={`doc-card-${doc.id}`}
      className="group relative bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5"
    >
      <div>
        {/* Top bar: Badge & Action menu */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Visual Badge for Owned vs Shared */}
          {isOwner ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Owned by you
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Users className="w-3 h-3 text-indigo-500" />
              Shared by {doc.owner?.name || 'Team member'}
            </span>
          )}

          {/* Context menu for document actions */}
          <div className="relative" ref={menuRef}>
            <button
              id={`doc-menu-btn-${doc.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
              title="Document actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  id={`action-open-${doc.id}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onOpen(doc.id);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open Document</span>
                </button>

                {isOwner && (
                  <>
                    <button
                      id={`action-rename-${doc.id}`}
                      onClick={() => {
                        setMenuOpen(false);
                        onRename(doc);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Rename</span>
                    </button>

                    <button
                      id={`action-share-${doc.id}`}
                      onClick={() => {
                        setMenuOpen(false);
                        onShare(doc);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Manage Sharing</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      id={`action-delete-${doc.id}`}
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(doc.id);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title & Preview Click area */}
        <div onClick={() => onOpen(doc.id)} className="cursor-pointer">
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {doc.title}
          </h3>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            Updated {formatRelativeTime(doc.updatedAt)}
          </p>
        </div>
      </div>

      {/* Footer: Owner & Sharing status */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-5 h-5 rounded-full ${doc.owner?.avatarBg || 'bg-slate-500'} text-white flex items-center justify-center text-[10px] font-semibold shrink-0`}
          >
            {getInitials(doc.owner?.name || 'U')}
          </div>
          <span className="truncate text-slate-600 font-medium">{doc.owner?.name}</span>
        </div>

        {shareCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md font-medium">
            <Share2 className="w-3 h-3" />
            <span>Shared ({shareCount})</span>
          </div>
        )}
      </div>
    </div>
  );
};
