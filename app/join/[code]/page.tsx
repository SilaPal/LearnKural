import JoinSchoolClient from './join-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Join Classroom | Learn Thirukkural Academy',
    description: 'Join a classroom from a teacher invite link',
};

export default function JoinSchoolPage({ params }: { params: { code: string } }) {
    return <JoinSchoolClient inviteCode={params.code} />;
}
