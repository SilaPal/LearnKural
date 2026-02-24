import { Metadata } from 'next';
import LearnTamilClient from './learntamil-client';

export const metadata: Metadata = {
  title: 'Learn Tamil Letters | தமிழ் எழுத்துக்கள் கற்க - Thirukkural Learning',
  description: 'Learn to write Tamil letters with interactive tracing. Master uyir, mei, and ayutha eluthukal through practice.',
};

export default function LearnTamilPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <LearnTamilClient />
    </div>
  );
}
