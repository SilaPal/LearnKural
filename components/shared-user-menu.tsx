import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  tier: string;
  role: string;
}

interface SharedUserMenuProps {
  user: User;
  isTamil: boolean;
  isPaidUser: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
  onLogout: () => void;
}

export function SharedUserMenu({
  user,
  isTamil,
  isPaidUser,
  onClose,
  onUpgradeClick,
  onLogout
}: SharedUserMenuProps) {
  return (
    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>

      {/* Plan Badge — click to open pricing modal */}
      <button
        onClick={() => { onClose(); onUpgradeClick(); }}
        className="w-full px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left group"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{isPaidUser ? '✨' : '🆓'}</span>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-gray-800">
                {isPaidUser
                  ? (isTamil ? 'பிரீமியம்' : 'Premium Plan')
                  : (isTamil ? 'இலவச திட்டம்' : 'Free Plan')}
              </span>
              <span className="text-xs text-gray-400">
                {isPaidUser
                  ? (isTamil ? 'திட்டத்தை நிர்வகிக்க' : 'Manage plan')
                  : (isTamil ? 'மேம்படுத்து →' : 'Upgrade →')}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Hall of Fame + My Hub (Visible to all, restricted on-page) */}
      <Link
        href="/leaderboard"
        onClick={onClose}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-colors border-b border-gray-100 group"
      >
        <span className="text-lg group-hover:scale-110 transition-transform">🔥</span>
        <span className="flex flex-col leading-tight">
          <span className="font-semibold text-gray-800">{isTamil ? 'பெருமை மேடை' : 'Hall of Fame'}</span>
          <span className="text-xs text-gray-400">{isTamil ? 'சிறந்தவர்கள் பட்டியல்' : 'Top players ranked'}</span>
        </span>
      </Link>
      <Link
        href={
          user.role === 'school_admin' ? '/dashboard/school' :
            user.role === 'teacher' ? '/dashboard/teacher' :
              user.role === 'parent' ? '/dashboard/parent' :
                '/schools/register'
        }
        onClick={onClose}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-colors border-b border-gray-100 group"
      >
        <span className="text-lg group-hover:scale-110 transition-transform">
          {user.role === 'school_admin' ? '🎓' :
            user.role === 'teacher' ? '📋' :
              user.role === 'parent' ? '👨‍👩‍👧' : '🏫'}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-semibold text-gray-800">
            {user.role === 'school_admin' ? (isTamil ? 'என் பள்ளி' : 'My School') :
              user.role === 'teacher' ? (isTamil ? 'வகுப்பு மேடை' : 'Class Hub') :
                user.role === 'parent' ? (isTamil ? 'குழந்தை முன்னேற்றம்' : "Kid's Hub") :
                  (isTamil ? 'பள்ளியில் சேர' : 'Join a School')}
          </span>
          <span className="text-xs text-gray-400">
            {user.role === 'school_admin' || user.role === 'teacher' || user.role === 'parent'
              ? (isTamil ? 'உங்கள் நிர்வாக மேடை' : 'Your admin portal')
              : (isTamil ? 'அழைப்புக் குறியீட்டை உள்ளிடுக' : 'Enter your invite code')}
          </span>
        </span>
      </Link>

      <button
        onClick={() => { onClose(); onLogout(); }}
        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        {isTamil ? 'வெளியேறு' : 'Logout'}
      </button>
    </div>
  );
}
