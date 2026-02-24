import { Metadata } from 'next';
import SchoolAdminClient from './school-admin-client';

export const metadata: Metadata = {
    title: 'School Admin Dashboard | Learn Thirukkural Online',
    description: 'Manage your academy, classrooms, and student progress.',
};

export default function SchoolAdminPage() {
    return <SchoolAdminClient />;
}
