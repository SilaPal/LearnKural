'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  tier: string;
  role: string;
  schoolId?: string | null;
}

interface ChildProfile {
  id: string;
  nickname: string;
  activeAvatarId: string;
  avatarThumbnail?: string | null;
}

interface SharedUserMenuProps {
  user: User;
  isTamil: boolean;
  isPaidUser: boolean;
  onClose: () => void;
  onUpgradeClick?: () => void;
  onLogout: () => void;
  onBadgesClick?: () => void;
  newBadgeCount?: number;
  isSchoolApproved?: boolean;
  hasChildProfiles?: boolean;
  activeProfileNickname?: string | null;
  profiles?: any[];
  onProfileSwitch?: (profileId: string | null) => void;
  onJoinClassClick?: () => void;
}

export function SharedUserMenu({
  user,
  isTamil,
  isPaidUser,
  onClose,
  onUpgradeClick,
  onLogout,
  onBadgesClick,
  isSchoolApproved = false,
  activeProfileNickname = null,
  profiles = [],
  onProfileSwitch,
  onJoinClassClick,
}: SharedUserMenuProps) {
  const router = useRouter();
  console.log('SharedUserMenu Props:', { role: user.role, isSchoolApproved });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(false);
  const isAdminEmail = user.email.toLowerCase() === 'anu.ganesan@gmail.com';

  const handleSwitchProfile = (profileId: string | null) => {
    if (onProfileSwitch) {
      onProfileSwitch(profileId);
    } else {
      onClose();
      router.push('/profile-select');
    }
  };

  const handleGlobalProfileSelect = () => {
    onClose();
    router.push('/profile-select');
  };

  const dashboardHref =
    user.role === 'super_admin' ? '/admin/waitlist' :
      user.role === 'school_admin' ? '/dashboard/school' :
        user.role === 'teacher' ? '/dashboard/teacher' :
          user.role === 'parent' ? '/dashboard/parent' :
            '/schools/register';

  const dashboardLabel =
    user.role === 'super_admin' ? (isTamil ? 'நிர்வாக மையம்' : 'Admin Portal') :
      user.role === 'school_admin' ? (isTamil ? 'நிர்வாக மையம்' : 'Admin Portal') :
        user.role === 'teacher' ? (isTamil ? 'மாணவர் மேடை' : 'Student Portal') :
          '';

  const dashboardEmoji =
    user.role === 'super_admin' ? '🛡️' :
      user.role === 'school_admin' ? '🎓' :
        user.role === 'teacher' ? '📋' : '🏫';

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 max-h-[85vh] overflow-y-auto">

      {/* ── User identity & Profile Switcher ── */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setProfilesOpen(o => !o)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
        >
          <div className="flex flex-col overflow-hidden">
            <p className="text-[13px] font-bold text-gray-800 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            {activeProfileNickname && (
              <p className="text-[10px] text-orange-500 font-bold mt-0.5">▶ {activeProfileNickname}</p>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profilesOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Profiles accordion */}
        {profilesOpen && (
          <div className="bg-gray-50/80 px-3 pb-3 pt-1 border-t border-gray-50">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 px-1">
              {isTamil ? 'சுயவிவரத்தை மாற்றவும்' : 'Switch Profile'}
            </p>
            <div className="flex flex-col gap-1.5">
              {/* Parent Profile */}
              <button
                onClick={() => handleSwitchProfile(null)}
                className={`flex items-center gap-3 w-full p-2 rounded-xl transition-all ${!activeProfileNickname ? 'bg-purple-50 ring-1 ring-purple-100' : 'hover:bg-white border border-transparent shadow-sm hover:border-purple-200'}`}
              >
                <div className="flex flex-col items-start overflow-hidden ml-2">
                  <span className="text-xs font-bold text-gray-800 truncate w-full">{user.name}</span>
                  <span className="text-[10px] text-gray-400 truncate w-full">{isTamil ? 'பெற்றோர்' : 'Parent'}</span>
                </div>
                {!activeProfileNickname && <span className="ml-auto text-purple-500 text-xs text-bold">●</span>}
              </button>

              {/* Child Profiles */}
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => handleSwitchProfile(profile.id)}
                  className={`flex items-center gap-3 w-full p-2 rounded-xl transition-all ${activeProfileNickname === profile.nickname ? 'bg-orange-50 ring-1 ring-orange-100' : 'hover:bg-white border border-transparent shadow-sm hover:border-orange-200'}`}
                >
                  <div className="flex flex-col items-start overflow-hidden ml-2">
                    <span className="text-xs font-bold text-gray-800 truncate w-full">{profile.nickname}</span>
                    <span className="text-[10px] text-gray-400 truncate w-full">{isTamil ? 'மாணவர்' : 'Student'}</span>
                  </div>
                  {activeProfileNickname === profile.nickname && <span className="ml-auto text-orange-500 text-xs text-bold">●</span>}
                </button>
              ))}

              {/* Add Profile Shortcut */}
              <button
                onClick={handleGlobalProfileSelect}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white transition-all border border-dashed border-gray-300 mt-1 group shadow-sm bg-white/50"
              >
                <span className="text-xs font-bold text-gray-500 group-hover:text-orange-600 transition-colors text-left uppercase tracking-tight ml-2">
                  {isTamil ? 'புதிய சுயவிவரம்' : 'Add Profile'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="pt-1">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 transition-colors group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform flex items-center justify-center text-purple-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-gray-800 text-[13px]">{isTamil ? 'முகப்பு' : 'Home'}</span>
            <span className="text-[10px] text-gray-400">{isTamil ? 'முதன்மை பக்கம்' : 'Main page'}</span>
          </span>
        </Link>

        <Link
          href="/leaderboard"
          onClick={onClose}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 transition-colors group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🔥</span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-gray-800 text-[13px]">{isTamil ? 'பெருமை மேடை' : 'Hall of Fame'}</span>
            <span className="text-[10px] text-gray-400">{isTamil ? 'சிறந்தவர்கள் பட்டியல்' : 'Top players ranked'}</span>
          </span>
        </Link>

        <Link
          href="/sandhai"
          onClick={onClose}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🛍️</span>
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-gray-800 text-[13px]">{isTamil ? 'சந்தை' : 'Sandhai'}</span>
            <span className="text-[10px] text-gray-400">{isTamil ? 'அவதாரங்கள் கடை' : 'Avatar Shop'}</span>
          </span>
        </Link>


        {/* Plan badge */}
        <button
          onClick={() => { onClose(); onUpgradeClick?.(); }}
          className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{isPaidUser ? '✨' : '🆓'}</span>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-gray-800 text-[13px]">
                {isPaidUser ? (isTamil ? 'பிரீமியம்' : 'Premium Plan') : (isTamil ? 'இலவச திட்டம்' : 'Free Plan')}
              </span>
              <span className="text-[10px] text-gray-400">
                {isPaidUser ? (isTamil ? 'திட்டத்தை நிர்வகிக்க' : 'Manage plan') : (isTamil ? 'மேம்படுத்து →' : 'Upgrade →')}
              </span>
            </div>
          </div>
        </button>

        {/* ── Tamil School (🏫) ── */}
        <div className="border-t border-gray-100 my-1 pt-1">
          <button
            onClick={() => setSchoolMenuOpen(o => !o)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg group-hover:scale-110 transition-transform">🏛️</span>
              <span className="font-bold text-gray-800 text-[13px]">{isTamil ? 'தமிழ் பள்ளி' : 'Tamil School'}</span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${schoolMenuOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {schoolMenuOpen && (
            <div className="bg-indigo-50/30 pb-2">
              {/* Register School Link */}
              {user.schoolId ? (
                <div className="relative group/reg">
                  <div
                    className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-60 transition-colors"
                  >
                    <span className="font-semibold text-[12px]">{isTamil ? 'பள்ளியைப் பதிவு செய்க' : 'Register a School'}</span>
                  </div>
                  {/* Custom Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[200px] bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover/reg:opacity-100 pointer-events-none transition-all z-[60] shadow-xl text-center">
                    {!isSchoolApproved
                      ? (isTamil ? 'உங்கள் பள்ளி பதிவு ஒப்புதலுக்காகக் காத்திருக்கிறது' : 'Your school registration is pending approval')
                      : (isTamil ? 'உங்கள் பள்ளி ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது' : 'Your school is already registered')
                    }
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/schools/register"
                  onClick={onClose}
                  className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group"
                >
                  <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'பள்ளியைப் பதிவு செய்க' : 'Register a School'}</span>
                </Link>
              )}

              {/* View Classes Link (For parents/students) */}
              <Link
                href="/dashboard/parent/classes"
                onClick={onClose}
                className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'வகுப்புகளைப் பார்க்க' : 'View Classes'}</span>
                  <span className="text-[9px] text-gray-400">{isTamil ? 'அனைத்து வகுப்புகள்' : 'View active & completed'}</span>
                </div>
              </Link>

              {/* Join Class Link */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onJoinClassClick) {
                    onJoinClassClick();
                  }
                  onClose();
                }}
                className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group text-left mb-1"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'வகுப்பில் சேர' : 'Join a Class'}</span>
                  <span className="text-[9px] text-gray-400">{isTamil ? 'குறியீட்டை உள்ளிடவும்' : 'Enter invite code'}</span>
                </div>
              </button>

              <div className="border-t border-indigo-100/50 my-1 mx-4"></div>

              {/* Administrative Portals (Admin Portal & Student Portal) */}
              {/* Student Portal: Visible to super_admin, school_admin, or teacher */}
              {(user.role === 'super_admin' || user.role === 'school_admin' || user.role === 'teacher' || isAdminEmail) && (
                <Link href="/dashboard/teacher" onClick={onClose} className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group">
                  <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'மாணவர் மேடை' : 'Student Portal'}</span>
                </Link>
              )}

              {/* Admin Portal: Visible to super_admin or school_admin */}
              {(user.role === 'super_admin' || user.role === 'school_admin' || isAdminEmail) && (
                <Link href="/dashboard/school" onClick={onClose} className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group">
                  <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'நிர்வாக மையம்' : 'Admin Portal'}</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ⚙️ Settings accordion */}
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">⚙️</span>
            <span className="font-bold text-gray-800 text-[13px]">{isTamil ? 'அமைப்புகள்' : 'Settings'}</span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="bg-gray-50/50">
            {/* Admin Portal (Super Admin or Admin Email) */}
            {(user.role === 'super_admin' || isAdminEmail) && (
              <Link
                href="/admin/waitlist"
                onClick={onClose}
                className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-colors group text-left"
              >
                <span className="font-semibold text-gray-700 text-[12px]">
                  {isTamil ? 'நிர்வாக பக்கம்' : 'Admin Portal'}
                </span>
              </Link>
            )}
            {(user.role === 'super_admin' || isAdminEmail) && (
              <Link
                href="/dashboard/superadmin/analytics"
                onClick={onClose}
                className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors group text-left"
              >
                <span className="font-semibold text-gray-700 text-[12px]">
                  {isTamil ? 'பகுப்பாய்வு' : 'Analytics'}
                </span>
              </Link>
            )}
            {/* Profiles Management Link */}
            <button
              onClick={handleGlobalProfileSelect}
              className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-colors group text-left"
            >
              <span className="font-semibold text-gray-700 text-[12px]">
                {isTamil ? 'சுயவிவரங்களை நிர்வகி' : 'Manage Profiles'}
              </span>
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => { onClose(); onLogout(); }}
            className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            {isTamil ? 'வெளியேறு' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
