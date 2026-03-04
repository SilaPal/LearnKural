import { Metadata } from 'next';
import RegisterClient from './register-client';

export const metadata: Metadata = {
    title: 'Register Your School | Learn Thirukkural Online',
    description: 'Empower your students with a gamified Tamil learning experience. Register your Tamil school or academy today.',
};

export default function RegisterSchoolPage() {
    return <RegisterClient />;
}
