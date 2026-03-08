const fs = require('fs');
const file = 'app/kural-learning/[slug]/kural-learning-client.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* --- START OF WORD BY WORD REVEAL SECTION ---\*\/\}[\s\S]*?\{\/\* --- END OF WORD BY WORD REVEAL SECTION ---\*\/\}/;

const newSection = `{\/\* --- START OF WORD BY WORD REVEAL SECTION ---\*\/}
        {\/\* You can comment out this entire <section> to disable the feature \*\/}
        <section 
          className="mb-8 bg-white rounded-2xl shadow-lg border-2 border-indigo-100 p-6 sm:p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-indigo-800">
              {currentLanguage === 'tamil' ? 'படிப்படியாக வாசிக்க' : 'Read Word by Word'}
            </h3>
            {isFullyRevealed && (
              <button 
                onClick={(e) => { e.stopPropagation(); resetReveal(); }}
                className="text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-100 px-4 py-2 rounded-full hover:bg-indigo-200 transition-colors shadow-sm"
              >
                {currentLanguage === 'tamil' ? 'மீண்டும் வாசிக்க' : 'Read Again'}
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-6 items-center w-full max-w-2xl mx-auto min-h-[160px] justify-center">
            {/* Top Row: First 4 words */}
            <div className="flex flex-wrap gap-x-4 gap-y-6 justify-center w-full">
              {kuralWords.slice(0, 4).map((word, index) => (
                <GamifiedWord 
                  key={\`top-\${index}\`}
                  word={word} 
                  mode={revealMode}
                  isNext={index === revealedWordCount}
                  isRevealed={index < revealedWordCount}
                  onReveal={handleRevealNext}
                />
              ))}
            </div>
            
            {/* Bottom Row: Remaining 3 words */}
            <div className="flex flex-wrap gap-x-4 gap-y-6 justify-center w-full">
              {kuralWords.slice(4, 7).map((word, index) => (
                <GamifiedWord 
                  key={\`bottom-\${index}\`}
                  word={word} 
                  mode={revealMode}
                  isNext={(index + 4) === revealedWordCount}
                  isRevealed={(index + 4) < revealedWordCount}
                  onReveal={handleRevealNext}
                />
              ))}
            </div>
          </div>

          {isFullyRevealed && (
            <div className="mt-8 text-center text-sm font-medium text-emerald-700 bg-emerald-50 py-3 px-4 rounded-xl border border-emerald-200 shadow-sm animate-fade-in">
               {currentLanguage === 'tamil' ? 'அருமை! இப்போது காணொளியைப் பார்க்கலாம்.' : 'Great! Now you can watch the video.'}
            </div>
          )}
        </section>
        {\/\* --- END OF WORD BY WORD REVEAL SECTION ---\*\/\}`;

if (regex.test(content)) {
  content = content.replace(regex, newSection);
  fs.writeFileSync(file, content);
  console.log('Success: Replaced section');
} else {
  console.log('Error: Could not find target regex');
}
