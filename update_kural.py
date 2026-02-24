import sys

file_path = 'app/kural-playing/kural-playing-client.tsx'
with open(file_path, 'r') as f:
    orig = content = f.read()

# 1. Imports
content = content.replace(
    "import BadgeModal from '@/components/badge-modal';",
    "import BadgeModal from '@/components/badge-modal';\nimport AuthModal from '@/components/auth-modal';\nimport { useAuth } from '@/lib/use-auth';"
)

# 2. Props
content = content.replace(
    "  initialKuralId?: number;\n}",
    "  initialKuralId?: number;\n  isEmbed?: boolean;\n}"
)

# 3. Signature
content = content.replace(
    "export default function KuralPlayingClient({ initialKurals, initialGame, initialKuralId }: Props) {",
    "export default function KuralPlayingClient({ initialKurals, initialGame, initialKuralId, isEmbed = false }: Props) {"
)

# 4. States
content = content.replace(
    "  const audioRef = useRef<HTMLAudioElement | null>(null);\n\n  const currentKural = initialKurals[currentKuralIndex];",
    "  const audioRef = useRef<HTMLAudioElement | null>(null);\n\n  const [showAuthModal, setShowAuthModal] = useState(false);\n  const [showUserMenu, setShowUserMenu] = useState(false);\n  const { user, logout } = useAuth();\n  const isPaidUser = user?.tier === 'paid';\n\n  const currentKural = initialKurals[currentKuralIndex];"
)

# 5. Root div and auth button
auth_ui = '''
      {!isEmbed && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
          {user ? (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-9 w-9 rounded-full border-2 border-white/60 shadow-lg"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-blue-500 border-2 border-white/60 shadow-lg flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{isPaidUser ? '✨' : '🆓'}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {isPaidUser
                            ? (currentLanguage === 'tamil' ? 'பிரீமியம்' : 'Premium Plan')
                            : (currentLanguage === 'tamil' ? 'இலவச திட்டம்' : 'Free Plan')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={async () => { await logout(); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {currentLanguage === 'tamil' ? 'வெளியேறு' : 'Logout'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 border border-transparent text-white rounded-lg transition-all text-sm font-semibold shadow"
              title={currentLanguage === 'tamil' ? 'உள்நுழைவு / பதிவு' : 'Login / Sign Up'}
              aria-label={currentLanguage === 'tamil' ? 'உள்நுழைவு' : 'Login'}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="hidden sm:inline">{currentLanguage === 'tamil' ? 'உள்நுழைவு' : 'Login'}</span>
            </button>
          )}
        </div>
      )}
'''

content = content.replace(
    '<div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">\n      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">',
    f'<div className="{{isEmbed ? \'\' : \'min-h-screen\'}} bg-gradient-to-br from-yellow-50 to-orange-100 relative">\n{auth_ui}\n      {{!isEmbed && (\n        <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">'
)

# 6. Close the header !isEmbed block
content = content.replace(
    '  </header>\n\n      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">',
    '  </header>\n      )}\n\n      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">'
)

# 7. Add AuthModal at end
content = content.replace(
    '    />\n      \n      {/* New Badge Earned Toast */}',
    '    />\n\n      <AuthModal\n        isOpen={showAuthModal}\n        onClose={() => setShowAuthModal(false)}\n        isTamil={currentLanguage === \'tamil\'}\n      />\n      \n      {/* New Badge Earned Toast */}'
)

# 8. puzzle game
content = content.replace(
    '<span className="text-lg font-semibold text-gray-700">\n                  {currentLanguage === \'tamil\' ? `குறள் ${currentKural.id}` : `Kural ${currentKural.id}`}\n                </span>\n                {isSolved && (',
    '{!isEmbed && (\n                  <span className="text-lg font-semibold text-gray-700">\n                    {currentLanguage === \'tamil\' ? `குறள் ${currentKural.id}` : `Kural ${currentKural.id}`}\n                  </span>\n                )}\n                {isSolved && ('
)

# 9. flying game
content = content.replace(
    '<span className="text-lg font-semibold text-gray-700">\n                  {currentLanguage === \'tamil\' ? `குறள் ${currentKural.id}` : `Kural ${currentKural.id}`}\n                </span>\n              </div>',
    '{!isEmbed && (\n                  <span className="text-lg font-semibold text-gray-700">\n                    {currentLanguage === \'tamil\' ? `குறள் ${currentKural.id}` : `Kural ${currentKural.id}`}\n                  </span>\n                )}\n              </div>'
)

# 10. balloon game
content = content.replace(
    '<span className="text-lg font-semibold text-red-800">\n                  🎈 {currentLanguage === \'tamil\' ? `குறள் ${currentKural.id}` : `Kural ${currentKural.id}`}\n                </span>\n                <span className="text-orange-600 text-sm">',
    '{!isEmbed && (\n                  <span className="text-lg font-semibold text-red-800">\n                    🎈 {currentLanguage === \'tamil\' ? `குறள் ${currentKural.id}` : `Kural ${currentKural.id}`}\n                  </span>\n                )}\n                <span className="text-orange-600 text-sm">'
)

# 11. race game
content = content.replace(
    '<span className="text-lg font-semibold text-gray-700">\n                  {currentLanguage === \'tamil\' ? `குறள் ${currentKural.id}` : `Kural ${currentKural.id}`}\n                </span>\n                <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">',
    '{!isEmbed && (\n                  <span className="text-lg font-semibold text-gray-700">\n                    {currentLanguage === \'tamil\' ? `குறள் ${currentKural.id}` : `Kural ${currentKural.id}`}\n                  </span>\n                )}\n                <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">'
)

# 12. footer nav
content = content.replace(
    '<nav className="flex items-center justify-center gap-4 mt-4">\n          <button\n            onClick={previousKural}',
    '{!isEmbed && (\n        <nav className="flex items-center justify-center gap-4 mt-4">\n          <button\n            onClick={previousKural}'
)
content = content.replace(
    '  </button>\n        </nav>\n      </main>',
    '  </button>\n        </nav>\n      )}\n      </main>'
)

with open(file_path, 'w') as f:
    f.write(content)
print("Replaced successfully")
