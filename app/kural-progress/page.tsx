import { Metadata } from 'next';
import KuralProgressClient from './kural-progress-client';

export const metadata: Metadata = {
  title: 'My Progress - Learn Thirukkural',
  description: 'Track your Thirukkural learning progress, view mastered kurals, and monitor your achievements.',
  alternates: { canonical: 'https://learnthirukkural.com/kural-progress' },
};

export default function KuralProgressPage() {
  return <KuralProgressClient />;
}
