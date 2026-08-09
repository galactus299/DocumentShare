import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  onGoBack: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ onGoBack }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied (403)</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        You do not have permission to view or edit this document. This document is restricted to its owner and specifically authorized team members.
      </p>
      <button
        onClick={onGoBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};
