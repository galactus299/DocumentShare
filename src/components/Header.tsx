import React from 'react';
import { User } from '../types';
import { UserSwitcher } from './UserSwitcher';
import { FileText, Plus, Upload } from 'lucide-react';

interface HeaderProps {
  users: User[];
  activeUser: User | null;
  onSwitchUser: (userId: string) => void;
  onCreateNewDocument: () => void;
  onOpenUploadModal: () => void;
  onGoHome: () => void;
  onOpenAuthModal: (tab: 'login' | 'signup') => void;
  onLogOut: () => void;
  currentView: 'dashboard' | 'editor';
}

export const Header: React.FC<HeaderProps> = ({
  users,
  activeUser,
  onSwitchUser,
  onCreateNewDocument,
  onOpenUploadModal,
  onGoHome,
  onOpenAuthModal,
  onLogOut,
  currentView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-button"
            onClick={onGoHome}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base tracking-tight group-hover:text-indigo-600 transition-colors">
                  DocuSync
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60">
                  Collab
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal hidden sm:block">Lightweight Document Editor</p>
            </div>
          </button>
        </div>

        {/* Right: Actions & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentView === 'dashboard' && (
            <>
              <button
                id="header-upload-btn"
                onClick={onOpenUploadModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import File</span>
              </button>

              <button
                id="header-create-doc-btn"
                onClick={onCreateNewDocument}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Doc</span>
              </button>
            </>
          )}

          <div className="h-5 w-px bg-slate-200 my-auto hidden sm:block" />

          <UserSwitcher
            users={users}
            activeUser={activeUser}
            onSwitchUser={onSwitchUser}
            onOpenAuthModal={onOpenAuthModal}
            onLogOut={onLogOut}
          />
        </div>
      </div>
    </header>
  );
};
