import { Metadata } from 'next';
import { getLetterById, getAllLetters, letterCategories } from '@/lib/tamil-letters';
import LetterTracingClient from './letter-tracing-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const letter = getLetterById(id);
  return {
    title: letter 
      ? `Learn ${letter.letter} | ${letter.nameTamil} - Tamil Letters` 
      : 'Learn Tamil Letter',
    description: letter 
      ? `Practice writing the Tamil letter ${letter.letter} (${letter.name}) with interactive tracing.` 
      : 'Practice writing Tamil letters.',
  };
}

export default async function LetterPage({ params }: Props) {
  const { id } = await params;
  const letter = getLetterById(id);
  const allLetters = getAllLetters();
  
  if (!letter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <span className="text-6xl mb-4 block">❓</span>
          <p className="text-gray-600">Letter not found</p>
        </div>
      </div>
    );
  }

  const category = letterCategories.find(c => c.letters.some(l => l.id === id));
  const currentIndex = allLetters.findIndex(l => l.id === id);
  const prevLetter = currentIndex > 0 ? allLetters[currentIndex - 1] : null;
  const nextLetter = currentIndex < allLetters.length - 1 ? allLetters[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <LetterTracingClient 
        letter={letter}
        category={category || null}
        prevLetterId={prevLetter?.id || null}
        nextLetterId={nextLetter?.id || null}
        letterIndex={currentIndex}
        totalLetters={allLetters.length}
      />
    </div>
  );
}
