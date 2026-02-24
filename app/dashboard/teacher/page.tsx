import { Metadata } from 'next';
import TeacherDashboardClient from './teacher-client';

export const metadata: Metadata = {
    title: 'Teacher Dashboard | Learn Thirukkural Online',
    description: 'Track student progress, manage classrooms, and guide your students through the Thirukkural journey.',
};

export default function TeacherDashboardPage() {
    return <TeacherDashboardClient />;
}
