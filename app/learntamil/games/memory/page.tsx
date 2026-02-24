import { Metadata } from 'next';
import MemoryGameClient from './memory-game-client';

export const metadata: Metadata = {
  title: 'Memory Match | நினைவு விளையாட்டு - Learn Tamil',
  description: 'Match Tamil letter pairs in this memory game. Flip cards to find matching letters.',
};

export default function MemoryGamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <MemoryGameClient />
    </div>
  );
}
