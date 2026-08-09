import React, { useState } from 'react';
import { Document, User } from '../types';
import { shareDocument, unshareDocument, shareDocumentByEmail, updatePublicSharing } from '../lib/api';
import {
  X,
  Users,
  Check,
  UserPlus,
  UserMinus,
  Globe,
  Link,
  Copy,
  Mail,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface ShareModalProps {
  document: Document;
  currentUser: User | null;
  users: User[];
  onClose: () => void;
  onDocumentUpdated: (doc: Document) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  document: doc,
  currentUser,
  users,
  onClose,
  onDocumentUpdated,
}) => {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [updatingPublic, setUpdatingPublic] = useState(false);

  // Filter out document owner from list
  const shareableUsers = users.filter((u) => u.id !== doc.ownerId);

  // Map of currently shared user IDs
  const sharedUserIds = new Set(doc.shares?.map((s) => s.userId) || []);

  const publicLink = `${window.location.origin}/#doc_${doc.id}?token=${doc.publicToken || ''}`;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    try {
      setUpdatingPublic(true);
      setErrorMsg(null);
      const updatedDoc = await updatePublicSharing(
        doc.id,
        isPublic,
        doc.publicAccessLevel || 'view',
        currentUser?.id
      );
      onDocumentUpdated(updatedDoc);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update public share settings');
    } finally {
      setUpdatingPublic(false);
    }
  };

  const handlePublicAccessLevelChange = async (level: 'view' | 'edit') => {
    try {
      setUpdatingPublic(true);
      setErrorMsg(null);
      const updatedDoc = await updatePublicSharing(
        doc.id,
        !!doc.isPublic,
        level,
        currentUser?.id
      );
      onDocumentUpdated(updatedDoc);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update public access level');
    } finally {
      setUpdatingPublic(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    try {
      setEmailLoading(true);
      setErrorMsg(null);
      const updatedDoc = await shareDocumentByEmail(doc.id, emailInput.trim(), currentUser?.id);
      setEmailInput('');
      onDocumentUpdated(updatedDoc);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to share by email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleToggleShare = async (targetUser: User) => {
    try {
      setLoadingUserId(targetUser.id);
      setErrorMsg(null);

      const isCurrentlyShared = sharedUserIds.has(targetUser.id);
      let updatedDoc: Document;

      if (isCurrentlyShared) {
        updatedDoc = await unshareDocument(doc.id, targetUser.id, currentUser?.id);
      } else {
        updatedDoc = await shareDocument(doc.id, targetUser.id, currentUser?.id);
      }

      onDocumentUpdated(updatedDoc);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update sharing settings');
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-medium">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Share Document</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{doc.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* 1. Public Share Link Section */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${doc.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Public Link Sharing</div>
                  <div className="text-[11px] text-slate-500">
                    {doc.isPublic ? 'Anyone with the link can access' : 'Restricted to invited members only'}
                  </div>
                </div>
              </div>

              {/* Public Toggle Switch */}
              <button
                type="button"
                disabled={updatingPublic}
                onClick={() => handleTogglePublic(!doc.isPublic)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  doc.isPublic ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    doc.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {doc.isPublic && (
              <div className="pt-3 border-t border-slate-200/60 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Access Level:</span>
                  <div className="relative flex-1">
                    <select
                      value={doc.publicAccessLevel || 'view'}
                      disabled={updatingPublic}
                      onChange={(e) => handlePublicAccessLevelChange(e.target.value as 'view' | 'edit')}
                      className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg py-1.5 px-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="view">Anyone with link can view (Read Only)</option>
                      <option value="edit">Anyone with link can edit (Public Editor)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Link Box */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-mono truncate flex items-center gap-2">
                    <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{publicLink}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Share via Email */}
          <form onSubmit={handleShareByEmail} className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Invite by Email Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={emailLoading || !emailInput.trim()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >
                {emailLoading ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          </form>

          {/* 3. Member Directory Sharing */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Registered Workspace Users</span>
              <span className="text-[11px] font-normal text-slate-500">
                {doc.shares?.length || 0} shared
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {shareableUsers.map((user) => {
                const isShared = sharedUserIds.has(user.id);
                const isLoading = loadingUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full ${user.avatarBg} text-white flex items-center justify-center text-[11px] font-semibold shrink-0`}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {user.role} &bull; {user.email}
                        </div>
                      </div>
                    </div>

                    <button
                      id={`share-toggle-btn-${user.id}`}
                      disabled={isLoading}
                      onClick={() => handleToggleShare(user)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                        isShared
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 group'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isLoading ? (
                        <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                      ) : isShared ? (
                        <>
                          <Check className="w-3.5 h-3.5 group-hover:hidden" />
                          <UserMinus className="w-3.5 h-3.5 hidden group-hover:block" />
                          <span className="group-hover:hidden">Shared ✓</span>
                          <span className="hidden group-hover:inline">Remove</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
