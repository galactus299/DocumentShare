import React, { useState, useEffect, useCallback } from 'react';
import { User, Document } from './types';
import {
  fetchUsers,
  switchUser,
  fetchDocuments,
  fetchDocumentById,
  createDocument,
  deleteDocument,
  updateDocument,
  fetchCurrentAuthUser,
  logOutUser,
} from './lib/api';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DocumentEditor } from './components/DocumentEditor';
import { ShareModal } from './components/ShareModal';
import { UploadModal } from './components/UploadModal';
import { RenameModal } from './components/RenameModal';
import { AuthModal } from './components/AuthModal';
import { AccessDenied } from './components/AccessDenied';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  const [ownedDocs, setOwnedDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);

  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [shareModalDoc, setShareModalDoc] = useState<Document | null>(null);
  const [renameModalDoc, setRenameModalDoc] = useState<Document | null>(null);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; tab: 'login' | 'signup' }>({
    isOpen: false,
    tab: 'login',
  });

  // Load initial user & documents
  const loadWorkspaceData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch users list
      const userData = await fetchUsers();
      setUsers(userData.users);

      // Fetch current logged in auth user
      const currentUser = await fetchCurrentAuthUser();
      if (currentUser) {
        setActiveUser(currentUser);
        const docs = await fetchDocuments(currentUser.id);
        setOwnedDocs(docs.owned);
        setSharedDocs(docs.shared);
      } else {
        // Fallback default user for first load
        const fallbackUser = userData.users[0] || null;
        setActiveUser(fallbackUser);
        if (fallbackUser) {
          const docs = await fetchDocuments(fallbackUser.id);
          setOwnedDocs(docs.owned);
          setSharedDocs(docs.shared);
        }
      }

      // Check URL hash or search for direct document deep links (e.g. #doc_1 or ?token=...)
      const fullHash = window.location.hash.replace('#', '');
      if (fullHash && fullHash.startsWith('doc_')) {
        const parts = fullHash.split('?');
        const docId = parts[0];
        let token: string | undefined;
        if (parts[1] && parts[1].includes('token=')) {
          token = parts[1].split('token=')[1].split('&')[0];
        }

        try {
          const doc = await fetchDocumentById(docId, currentUser?.id, token);
          setActiveDoc(doc);
          setCurrentView('editor');
          setAccessDenied(false);
        } catch (err: any) {
          if (err.message && err.message.includes('403')) {
            setAccessDenied(true);
            setCurrentView('editor');
          }
        }
      }
    } catch (err) {
      console.error('Error loading workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Auth Success Handler (Login / Signup)
  const handleAuthSuccess = async (user: User) => {
    setActiveUser(user);
    const userData = await fetchUsers();
    setUsers(userData.users);

    const docs = await fetchDocuments(user.id);
    setOwnedDocs(docs.owned);
    setSharedDocs(docs.shared);

    if (currentView === 'editor' && activeDoc) {
      try {
        const reloaded = await fetchDocumentById(activeDoc.id, user.id);
        setActiveDoc(reloaded);
        setAccessDenied(false);
      } catch {
        // keep existing public doc
      }
    }
  };

  // Log Out Handler
  const handleLogOut = async () => {
    await logOutUser();
    setActiveUser(null);
    setOwnedDocs([]);
    setSharedDocs([]);
    if (currentView === 'editor' && !activeDoc?.isPublicAccess) {
      handleGoHome();
    }
  };

  // Switch Active User (for rapid testing)
  const handleSwitchUser = async (userId: string) => {
    try {
      const newUser = await switchUser(userId);
      setActiveUser(newUser);

      const docs = await fetchDocuments(newUser.id);
      setOwnedDocs(docs.owned);
      setSharedDocs(docs.shared);

      if (currentView === 'editor' && activeDoc) {
        try {
          const reloadedDoc = await fetchDocumentById(activeDoc.id, newUser.id);
          setActiveDoc(reloadedDoc);
          setAccessDenied(false);
        } catch (err: any) {
          if (err.message && err.message.includes('403')) {
            setAccessDenied(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  // Create new document
  const handleCreateNewDocument = async () => {
    if (!activeUser) {
      setAuthModalState({ isOpen: true, tab: 'signup' });
      return;
    }
    try {
      const newDoc = await createDocument('Untitled document', undefined, activeUser.id);
      setActiveDoc(newDoc);
      setAccessDenied(false);
      setCurrentView('editor');
      window.location.hash = newDoc.id;

      const docs = await fetchDocuments(activeUser.id);
      setOwnedDocs(docs.owned);
      setSharedDocs(docs.shared);
    } catch (err) {
      console.error('Error creating document:', err);
    }
  };

  // Open existing document
  const handleOpenDocument = async (docId: string) => {
    try {
      const doc = await fetchDocumentById(docId, activeUser?.id);
      setActiveDoc(doc);
      setAccessDenied(false);
      setCurrentView('editor');
      window.location.hash = docId;
    } catch (err: any) {
      if (err.message && err.message.includes('403')) {
        setAccessDenied(true);
        setCurrentView('editor');
      }
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId: string) => {
    if (!activeUser) return;
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(docId, activeUser.id);
      setOwnedDocs((prev) => prev.filter((d) => d.id !== docId));
      if (activeDoc?.id === docId) {
        handleGoHome();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Rename document
  const handleRenameDocument = async (docId: string, newTitle: string) => {
    if (!activeUser) return;
    try {
      const updated = await updateDocument(docId, { title: newTitle }, activeUser.id);

      setOwnedDocs((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      setSharedDocs((prev) => prev.map((d) => (d.id === docId ? updated : d)));

      if (activeDoc?.id === docId) {
        setActiveDoc(updated);
      }
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  // Document state update callback
  const handleDocumentUpdated = (updatedDoc: Document) => {
    setActiveDoc(updatedDoc);
    setOwnedDocs((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    setSharedDocs((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));

    if (shareModalDoc?.id === updatedDoc.id) {
      setShareModalDoc(updatedDoc);
    }
  };

  // Go to Dashboard
  const handleGoHome = () => {
    setCurrentView('dashboard');
    setActiveDoc(null);
    setAccessDenied(false);
    window.location.hash = '';
  };

  // On File Upload Success
  const handleUploadSuccess = (newDoc: Document) => {
    setUploadModalOpen(false);
    setActiveDoc(newDoc);
    setAccessDenied(false);
    setCurrentView('editor');
    window.location.hash = newDoc.id;

    if (activeUser) {
      fetchDocuments(activeUser.id).then((docs) => {
        setOwnedDocs(docs.owned);
        setSharedDocs(docs.shared);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading workspace & documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Header */}
      <Header
        users={users}
        activeUser={activeUser}
        onSwitchUser={handleSwitchUser}
        onCreateNewDocument={handleCreateNewDocument}
        onOpenUploadModal={() => setUploadModalOpen(true)}
        onGoHome={handleGoHome}
        onOpenAuthModal={(tab) => setAuthModalState({ isOpen: true, tab })}
        onLogOut={handleLogOut}
        currentView={currentView}
      />

      {/* Main Content View */}
      {currentView === 'dashboard' ? (
        <Dashboard
          ownedDocuments={ownedDocs}
          sharedDocuments={sharedDocs}
          currentUser={activeUser}
          onCreateNewDocument={handleCreateNewDocument}
          onOpenUploadModal={() => setUploadModalOpen(true)}
          onOpenDocument={handleOpenDocument}
          onRenameDocument={(doc) => setRenameModalDoc(doc)}
          onShareDocument={(doc) => setShareModalDoc(doc)}
          onDeleteDocument={handleDeleteDocument}
        />
      ) : accessDenied ? (
        <AccessDenied onGoBack={handleGoHome} />
      ) : activeDoc ? (
        <DocumentEditor
          document={activeDoc}
          currentUser={activeUser}
          users={users}
          onBackToDashboard={handleGoHome}
          onOpenShareModal={(doc) => setShareModalDoc(doc)}
          onDocumentUpdated={handleDocumentUpdated}
          onOpenAuthModal={(tab) => setAuthModalState({ isOpen: true, tab })}
        />
      ) : null}

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialTab={authModalState.tab}
        onClose={() => setAuthModalState({ isOpen: false, tab: 'login' })}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          currentUser={activeUser}
          onClose={() => setUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Share Modal */}
      {shareModalDoc && (
        <ShareModal
          document={shareModalDoc}
          currentUser={activeUser}
          users={users}
          onClose={() => setShareModalDoc(null)}
          onDocumentUpdated={handleDocumentUpdated}
        />
      )}

      {/* Rename Modal */}
      {renameModalDoc && (
        <RenameModal
          document={renameModalDoc}
          onClose={() => setRenameModalDoc(null)}
          onSave={handleRenameDocument}
        />
      )}
    </div>
  );
}
