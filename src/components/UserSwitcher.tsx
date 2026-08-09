import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { ChevronDown, Check, UserPlus, LogIn, LogOut, UserCheck } from 'lucide-react';

interface UserSwitcherProps {
  users: User[];
  activeUser: User | null;
  onSwitchUser: (userId: string) => void;
  onOpenAuthModal: (tab: 'login' | 'signup') => void;
  onLogOut: () => void;
}

export const UserSwitcher: React.FC<UserSwitcherProps> = ({
  users,
  activeUser,
  onSwitchUser,
  onOpenAuthModal,
  onLogOut,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  if (!activeUser) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenAuthModal('login')}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
        <button
          onClick={() => onOpenAuthModal('signup')}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Sign Up</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef} id="user-switcher-container">
      <button
        id="user-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        title="Account Settings & Switcher"
      >
        <div className={`w-7 h-7 rounded-full ${activeUser.avatarBg} text-white flex items-center justify-center text-xs font-semibold shrink-0`}>
          {getInitials(activeUser.name)}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-xs font-semibold leading-none text-slate-900">{activeUser.name}</div>
          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{activeUser.role}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/60">
            <div className="text-xs font-bold text-slate-900">{activeUser.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{activeUser.email}</div>
          </div>

          {/* Quick Account Switcher */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Switch Account
            </div>
            {users.map((user) => {
              const isSelected = user.id === activeUser.id;
              return (
                <button
                  key={user.id}
                  id={`user-option-${user.id}`}
                  onClick={() => {
                    onSwitchUser(user.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                    isSelected ? 'bg-indigo-50/60 font-medium' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-full ${user.avatarBg} text-white flex items-center justify-center text-[10px] font-semibold shrink-0`}>
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{user.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-1 mt-1 px-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal('signup');
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add or Sign Up New Account</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onLogOut();
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
