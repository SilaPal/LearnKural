export interface TamilLetter {
  id: string;
  letter: string;
  name: string;
  nameTamil: string;
  pronunciation: string;
  category: 'uyir' | 'mei' | 'uyirmei' | 'ayutha';
  audioUrl?: string;
}

export interface LetterCategory {
  id: string;
  name: string;
  nameTamil: string;
  description: string;
  descriptionTamil: string;
  icon: string;
  color: string;
  letters: TamilLetter[];
}

// Uyir Eluthukal (Vowels) - 12 letters
const uyirLetters: TamilLetter[] = [
  { id: 'a', letter: 'அ', name: 'a', nameTamil: 'அ', pronunciation: 'a (as in about)', category: 'uyir' },
  { id: 'aa', letter: 'ஆ', name: 'aa', nameTamil: 'ஆ', pronunciation: 'aa (as in father)', category: 'uyir' },
  { id: 'i', letter: 'இ', name: 'i', nameTamil: 'இ', pronunciation: 'i (as in bit)', category: 'uyir' },
  { id: 'ee', letter: 'ஈ', name: 'ee', nameTamil: 'ஈ', pronunciation: 'ee (as in feet)', category: 'uyir' },
  { id: 'u', letter: 'உ', name: 'u', nameTamil: 'உ', pronunciation: 'u (as in put)', category: 'uyir' },
  { id: 'oo', letter: 'ஊ', name: 'oo', nameTamil: 'ஊ', pronunciation: 'oo (as in boot)', category: 'uyir' },
  { id: 'e', letter: 'எ', name: 'e', nameTamil: 'எ', pronunciation: 'e (as in bed)', category: 'uyir' },
  { id: 'ae', letter: 'ஏ', name: 'ae', nameTamil: 'ஏ', pronunciation: 'ae (as in day)', category: 'uyir' },
  { id: 'ai', letter: 'ஐ', name: 'ai', nameTamil: 'ஐ', pronunciation: 'ai (as in sky)', category: 'uyir' },
  { id: 'o', letter: 'ஒ', name: 'o', nameTamil: 'ஒ', pronunciation: 'o (as in go)', category: 'uyir' },
  { id: 'oo2', letter: 'ஓ', name: 'oo', nameTamil: 'ஓ', pronunciation: 'oo (as in door)', category: 'uyir' },
  { id: 'au', letter: 'ஔ', name: 'au', nameTamil: 'ஔ', pronunciation: 'au (as in out)', category: 'uyir' },
];

// Mei Eluthukal (Consonants) - 18 letters
const meiLetters: TamilLetter[] = [
  { id: 'k', letter: 'க்', name: 'k', nameTamil: 'க்', pronunciation: 'k (as in king)', category: 'mei' },
  { id: 'ng', letter: 'ங்', name: 'ng', nameTamil: 'ங்', pronunciation: 'ng (as in sing)', category: 'mei' },
  { id: 'ch', letter: 'ச்', name: 'ch', nameTamil: 'ச்', pronunciation: 'ch (as in church)', category: 'mei' },
  { id: 'nj', letter: 'ஞ்', name: 'nj', nameTamil: 'ஞ்', pronunciation: 'nj (as in inch)', category: 'mei' },
  { id: 't1', letter: 'ட்', name: 't', nameTamil: 'ட்', pronunciation: 't (retroflex)', category: 'mei' },
  { id: 'n1', letter: 'ண்', name: 'n', nameTamil: 'ண்', pronunciation: 'n (retroflex)', category: 'mei' },
  { id: 'th', letter: 'த்', name: 'th', nameTamil: 'த்', pronunciation: 'th (as in that)', category: 'mei' },
  { id: 'n2', letter: 'ந்', name: 'n', nameTamil: 'ந்', pronunciation: 'n (dental)', category: 'mei' },
  { id: 'p', letter: 'ப்', name: 'p', nameTamil: 'ப்', pronunciation: 'p (as in pen)', category: 'mei' },
  { id: 'm', letter: 'ம்', name: 'm', nameTamil: 'ம்', pronunciation: 'm (as in man)', category: 'mei' },
  { id: 'y', letter: 'ய்', name: 'y', nameTamil: 'ய்', pronunciation: 'y (as in yes)', category: 'mei' },
  { id: 'r', letter: 'ர்', name: 'r', nameTamil: 'ர்', pronunciation: 'r (as in run)', category: 'mei' },
  { id: 'l', letter: 'ல்', name: 'l', nameTamil: 'ல்', pronunciation: 'l (as in like)', category: 'mei' },
  { id: 'v', letter: 'வ்', name: 'v', nameTamil: 'வ்', pronunciation: 'v (as in van)', category: 'mei' },
  { id: 'zh', letter: 'ழ்', name: 'zh', nameTamil: 'ழ்', pronunciation: 'zh (unique Tamil)', category: 'mei' },
  { id: 'l2', letter: 'ள்', name: 'l', nameTamil: 'ள்', pronunciation: 'l (retroflex)', category: 'mei' },
  { id: 'r2', letter: 'ற்', name: 'r', nameTamil: 'ற்', pronunciation: 'r (alveolar trill)', category: 'mei' },
  { id: 'n3', letter: 'ன்', name: 'n', nameTamil: 'ன்', pronunciation: 'n (alveolar)', category: 'mei' },
];

// Ayutha Eluthu (Special) - 1 letter
const ayuthaLetters: TamilLetter[] = [
  { id: 'aytham', letter: 'ஃ', name: 'aytham', nameTamil: 'ஆய்தம்', pronunciation: 'a brief pause', category: 'ayutha' },
];

// Base consonants for uyirmei (without pulli) - defined early for generateUyirmeiLetters
const meiBaseLetters = [
  { mei: 'க்', base: 'க', name: 'ka' },
  { mei: 'ங்', base: 'ங', name: 'nga' },
  { mei: 'ச்', base: 'ச', name: 'cha' },
  { mei: 'ஞ்', base: 'ஞ', name: 'nja' },
  { mei: 'ட்', base: 'ட', name: 'ta' },
  { mei: 'ண்', base: 'ண', name: 'na' },
  { mei: 'த்', base: 'த', name: 'tha' },
  { mei: 'ந்', base: 'ந', name: 'ntha' },
  { mei: 'ப்', base: 'ப', name: 'pa' },
  { mei: 'ம்', base: 'ம', name: 'ma' },
  { mei: 'ய்', base: 'ய', name: 'ya' },
  { mei: 'ர்', base: 'ர', name: 'ra' },
  { mei: 'ல்', base: 'ல', name: 'la' },
  { mei: 'வ்', base: 'வ', name: 'va' },
  { mei: 'ழ்', base: 'ழ', name: 'zha' },
  { mei: 'ள்', base: 'ள', name: 'la2' },
  { mei: 'ற்', base: 'ற', name: 'ra2' },
  { mei: 'ன்', base: 'ன', name: 'na2' },
];

// Vowel signs (markers) for combining with consonants
const uyirMarkers = [
  { uyir: 'அ', marker: '', name: 'a' },
  { uyir: 'ஆ', marker: 'ா', name: 'aa' },
  { uyir: 'இ', marker: 'ி', name: 'i' },
  { uyir: 'ஈ', marker: 'ீ', name: 'ee' },
  { uyir: 'உ', marker: 'ு', name: 'u' },
  { uyir: 'ஊ', marker: 'ூ', name: 'oo' },
  { uyir: 'எ', marker: 'ெ', name: 'e' },
  { uyir: 'ஏ', marker: 'ே', name: 'ae' },
  { uyir: 'ஐ', marker: 'ை', name: 'ai' },
  { uyir: 'ஒ', marker: 'ொ', name: 'o' },
  { uyir: 'ஓ', marker: 'ோ', name: 'oo2' },
  { uyir: 'ஔ', marker: 'ௌ', name: 'au' },
];

// Generate Uyirmei Letters (216 letters = 18 mei × 12 uyir) using shared data
function generateUyirmeiLetters(): TamilLetter[] {
  const letters: TamilLetter[] = [];
  
  meiBaseLetters.forEach(mei => {
    uyirMarkers.forEach(uyir => {
      const combinedLetter = mei.base + uyir.marker;
      const pronunciation = `${mei.name}${uyir.name === 'a' ? '' : uyir.name}`;
      letters.push({
        id: `uyirmei-${mei.name}-${uyir.name}`,
        letter: combinedLetter,
        name: pronunciation,
        nameTamil: combinedLetter,
        pronunciation: pronunciation,
        category: 'uyirmei',
      });
    });
  });
  
  return letters;
}

const uyirmeiLetters = generateUyirmeiLetters();

export const letterCategories: LetterCategory[] = [
  {
    id: 'uyir',
    name: 'Uyir Eluthukal',
    nameTamil: 'உயிர் எழுத்துக்கள்',
    description: 'Vowels - The soul letters (12 letters)',
    descriptionTamil: 'உயிர் எழுத்துக்கள் - 12 எழுத்துக்கள்',
    icon: '🌟',
    color: 'from-orange-400 to-red-500',
    letters: uyirLetters,
  },
  {
    id: 'mei',
    name: 'Mei Eluthukal',
    nameTamil: 'மெய் எழுத்துக்கள்',
    description: 'Consonants - The body letters (18 letters)',
    descriptionTamil: 'மெய் எழுத்துக்கள் - 18 எழுத்துக்கள்',
    icon: '💪',
    color: 'from-blue-400 to-indigo-500',
    letters: meiLetters,
  },
  {
    id: 'ayutha',
    name: 'Ayutha Eluthu',
    nameTamil: 'ஆய்த எழுத்து',
    description: 'Special character (1 letter)',
    descriptionTamil: 'ஆய்த எழுத்து - 1 எழுத்து',
    icon: '✨',
    color: 'from-purple-400 to-pink-500',
    letters: ayuthaLetters,
  },
  {
    id: 'uyirmei',
    name: 'Uyirmei Eluthukal',
    nameTamil: 'உயிர்மெய் எழுத்துக்கள்',
    description: 'Combined letters - Mei + Uyir (216 letters)',
    descriptionTamil: 'உயிர்மெய் எழுத்துக்கள் - 216 எழுத்துக்கள்',
    icon: '🔗',
    color: 'from-emerald-400 to-teal-500',
    letters: uyirmeiLetters,
  },
];

export function getAllLetters(): TamilLetter[] {
  return letterCategories.flatMap(cat => cat.letters);
}

export function getLetterById(id: string): TamilLetter | undefined {
  return getAllLetters().find(l => l.id === id);
}

export function getCategoryById(id: string): LetterCategory | undefined {
  return letterCategories.find(c => c.id === id);
}

export function getLettersByCategory(categoryId: string): TamilLetter[] {
  const category = getCategoryById(categoryId);
  return category?.letters || [];
}

// Uyirmei (Combined Letters) - Mei + Uyir combinations
export interface UyirmeiLetter {
  id: string;
  letter: string;
  mei: string;
  meiBase: string;
  uyir: string;
  pronunciation: string;
}

// Generate all uyirmei combinations for a specific consonant
export function getUyirmeiForMei(meiBase: string): UyirmeiLetter[] {
  const mei = meiBaseLetters.find(m => m.base === meiBase || m.mei === meiBase);
  if (!mei) return [];
  
  return uyirMarkers.map((u, idx) => ({
    id: `${mei.name}-${u.name}`,
    letter: mei.base + u.marker,
    mei: mei.mei,
    meiBase: mei.base,
    uyir: u.uyir,
    pronunciation: `${mei.name}${u.name === 'a' ? '' : u.name}`,
  }));
}

// Get a random set of uyirmei letters for quiz
export function getRandomUyirmeiQuiz(count: number = 4): { 
  question: UyirmeiLetter; 
  options: { mei: string; uyir: string }[];
  correctIndex: number;
}[] {
  const quizzes: { question: UyirmeiLetter; options: { mei: string; uyir: string }[]; correctIndex: number }[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomMei = meiBaseLetters[Math.floor(Math.random() * meiBaseLetters.length)];
    const randomUyir = uyirMarkers[Math.floor(Math.random() * uyirMarkers.length)];
    
    const question: UyirmeiLetter = {
      id: `${randomMei.name}-${randomUyir.name}`,
      letter: randomMei.base + randomUyir.marker,
      mei: randomMei.mei,
      meiBase: randomMei.base,
      uyir: randomUyir.uyir,
      pronunciation: `${randomMei.name}${randomUyir.name === 'a' ? '' : randomUyir.name}`,
    };
    
    // Generate 3 wrong options + 1 correct
    const options: { mei: string; uyir: string }[] = [];
    const correctOption = { mei: randomMei.base, uyir: randomUyir.uyir };
    
    while (options.length < 3) {
      const wrongMei = meiBaseLetters[Math.floor(Math.random() * meiBaseLetters.length)];
      const wrongUyir = uyirMarkers[Math.floor(Math.random() * uyirMarkers.length)];
      const wrongOption = { mei: wrongMei.base, uyir: wrongUyir.uyir };
      
      if (wrongMei.base !== randomMei.base || wrongUyir.uyir !== randomUyir.uyir) {
        if (!options.some(o => o.mei === wrongOption.mei && o.uyir === wrongOption.uyir)) {
          options.push(wrongOption);
        }
      }
    }
    
    const correctIndex = Math.floor(Math.random() * 4);
    options.splice(correctIndex, 0, correctOption);
    
    quizzes.push({ question, options, correctIndex });
  }
  
  return quizzes;
}

export { uyirLetters, meiLetters, uyirmeiLetters, meiBaseLetters, uyirMarkers };
