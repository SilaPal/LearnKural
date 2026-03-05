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
  hasChildProfiles?: boolean;
  activeProfileNickname?: string | null;
  profiles?: ChildProfile[];
  onProfileSwitch?: (profileId: string | null) => void;
}

export function SharedUserMenu({
  user,
  isTamil,
  isPaidUser,
  onClose,
  onUpgradeClick,
  onLogout,
  activeProfileNickname = null,
  profiles = [],
  onProfileSwitch,
}: SharedUserMenuProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(true);

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
    user.role === 'super_admin' ? (isTamil ? 'நிர்வாக பக்கம்' : 'Admin Portal') :
      user.role === 'school_admin' ? (isTamil ? 'என் பள்ளி' : 'My School') :
        user.role === 'teacher' ? (isTamil ? 'வகுப்பு மேடை' : 'Class Hub') :
          user.role === 'parent' ? (isTamil ? 'குழந்தை முன்னேற்றம்' : "Kid's Hub") :
            (isTamil ? 'பள்ளியில் சேர' : 'Join a School');

  const dashboardEmoji =
    user.role === 'super_admin' ? '🛡️' :
      user.role === 'school_admin' ? '🎓' :
        user.role === 'teacher' ? '📋' :
          user.role === 'parent' ? '👨‍👩‍👧' : '🏫';

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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-purple-200 shadow-sm">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-purple-600">{user.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex flex-col items-start overflow-hidden">
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-orange-200 shadow-sm">
                    {profile.avatarThumbnail ? (
                      <img src={profile.avatarThumbnail} alt={profile.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">👤</span>
                    )}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
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
                <div className="w-8 h-8 rounded-full bg-gray-50 flex-shrink-0 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-colors border border-gray-100">
                  <span className="text-lg">+</span>
                </div>
                <span className="text-xs font-bold text-gray-500 group-hover:text-orange-600 transition-colors text-left uppercase tracking-tight">
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
              <span className="text-lg group-hover:scale-110 transition-transform">🏫</span>
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
              {/* Dashboard / Hub Link */}
              <Link
                href={dashboardHref}
                onClick={onClose}
                className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700 text-[12px]">{dashboardLabel}</span>
                  <span className="text-[9px] text-gray-400">{isTamil ? 'முக்கிய மேடை' : 'Primary Dashboard'}</span>
                </div>
              </Link>

              {/* Kid's Hub Link (For Teachers who are also Parents) */}
              {(user.role === 'teacher' || user.role === 'school_admin' || user.role === 'super_admin') && profiles.length > 0 && (
                <Link
                  href="/dashboard/parent"
                  onClick={onClose}
                  className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'குழந்தை முன்னேற்றம்' : "Kid's Hub"}</span>
                    <span className="text-[9px] text-gray-400">{isTamil ? 'பெற்றோர் பக்கம்' : 'Parent View'}</span>
                  </div>
                </Link>
              )}

              {/* Create Class Link (Admins & Teachers) */}
              {(user.role === 'super_admin' || user.role === 'school_admin' || user.role === 'teacher') && (
                <Link
                  href={user.role === 'teacher' ? '/dashboard/teacher?create=true' : '/dashboard/teacher?create=true'}
                  onClick={onClose}
                  className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group"
                >
                  <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'வகுப்பை உருவாக்கு' : 'Create Class'}</span>
                </Link>
              )}

              {/* Join Link (Parents / Others) */}
              {(user.role !== 'school_admin' && user.role !== 'super_admin') && (
                <Link
                  href="/schools/register"
                  onClick={onClose}
                  className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group"
                >
                  <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'பள்ளியில் சேர' : 'Join a School'}</span>
                </Link>
              )}

              {/* Register School (Only Super Admin) */}
              {user.role === 'super_admin' && (
                <Link
                  href="/schools/register"
                  onClick={onClose}
                  className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-sm text-gray-700 hover:bg-white transition-colors group"
                >
                  <span className="font-semibold text-gray-700 text-[12px]">{isTamil ? 'பள்ளியை பதிவு செய்' : 'Register New School'}</span>
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
