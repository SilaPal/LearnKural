import { Metadata } from 'next';
import SandhaiClient from './sandhai-client';

export const metadata: Metadata = {
    title: 'Sandhai - Avatar Shop | Learn Thirukural',
    description: 'Spend your earned coins to unlock new avatars in the Sandhai!',
    alternates: { canonical: 'https://learnthirukkural.com/sandhai' },
};

export default function SandhaiPage() {
    return <SandhaiClient />;
}
