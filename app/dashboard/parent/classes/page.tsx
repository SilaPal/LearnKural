import { Metadata } from 'next';
import ParentClassesClient from './classes-client';

export const metadata: Metadata = {
    title: 'My Classes | LearnKural Academy',
    description: 'View student classroom enrollment and progress.',
};

export default function ParentClassesPage() {
    return <ParentClassesClient />;
}
