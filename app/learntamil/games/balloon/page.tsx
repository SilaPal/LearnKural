import { Metadata } from 'next';
import BalloonGameClient from './balloon-game-client';

export const metadata: Metadata = {
  title: 'Letter Pop | எழுத்து பலூன் - Learn Tamil',
  description: 'Pop the balloon with the correct Tamil letter. A fun way to learn Tamil alphabet.',
};

export default function BalloonGamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200">
      <BalloonGameClient />
    </div>
  );
}
