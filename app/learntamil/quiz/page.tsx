import { Metadata } from 'next';
import UyirmeiQuizClient from './uyirmei-quiz-client';

export const metadata: Metadata = {
  title: 'Uyirmei Quiz | உயிர்மெய் வினாடி வினா - Learn Tamil',
  description: 'Test your knowledge of Tamil combined letters. Identify which consonant and vowel combine to form each letter.',
};

export default function UyirmeiQuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <UyirmeiQuizClient />
    </div>
  );
}
