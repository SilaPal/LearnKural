'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import PricingModal from '@/components/pricing-modal';
import BadgeModal from '@/components/badge-modal';
import AuthModal from '@/components/auth-modal';

interface DashboardData {
    school: {
        id: string;
        name: string;
        logo: string | null;
        banner: string | null;
    };
    stats: {
        students: number;
        classrooms: number;
        staff: number;
    };
    classrooms: any[];
    staff: any[];
    recentUsers: any[];
}

export default function SchoolAdminClient() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isTamil, setIsTamil] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [teacherInviteCode, setTeacherInviteCode] = useState<string | null>(null);
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [teacherEmail, setTeacherEmail] = useState('');
    const [addingTeacher, setAddingTeacher] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [studentPage, setStudentPage] = useState(1);
    const [studentTotalPages, setStudentTotalPages] = useState(1);
    const [studentSearch, setStudentSearch] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [classroomTab, setClassroomTab] = useState<'active' | 'completed'>('active');

    // New Class Modal State
    const [showAddClassModal, setShowAddClassModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassStartDate, setNewClassStartDate] = useState('');
    const [newClassEndDate, setNewClassEndDate] = useState('');
    const [creatingClass, setCreatingClass] = useState(false);

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteCodeForClass, setInviteCodeForClass] = useState('');
    const [inviteClassName, setInviteClassName] = useState('');

    // Manage Class Modal State
    const [showManageClassModal, setShowManageClassModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [manageClassName, setManageClassName] = useState('');
    const [manageClassStartDate, setManageClassStartDate] = useState('');
    const [manageClassEndDate, setManageClassEndDate] = useState('');
    const [manageClassTeacherId, setManageClassTeacherId] = useState('');
    const [updatingClass, setUpdatingClass] = useState(false);
    const [deletingClass, setDeletingClass] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => setIsTamil((e as CustomEvent<{ isTamil: boolean }>).detail.isTamil);
        window.addEventListener('tamillanguagechange', handler);
        return () => window.removeEventListener('tamillanguagechange', handler);
    }, []);

    const toggleLanguage = () => {
        const next = !isTamil;
        setIsTamil(next);
        localStorage.setItem('thirukural-language', next ? 'tamil' : 'english');
        window.dispatchEvent(new CustomEvent('tamillanguagechange', { detail: { isTamil: next } }));
    };


    useEffect(() => {
        if (!isLoading && (!user || (user.role !== 'school_admin' && user.role !== 'super_admin'))) {
            router.push('/schools/register');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/school');
                if (res.ok) {
                    setData(await res.json());
                } else {
                    setError('Failed to load dashboard');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isLoading, router]);

    // Fetch students separately for pagination
    useEffect(() => {
        if (!data?.school.id) return;

        const fetchStudents = async () => {
            setLoadingStudents(true);
            try {
                const params = new URLSearchParams({
                    page: studentPage.toString(),
                    limit: '10',
                    search: studentSearch
                });

                const res = await fetch(`/api/dashboard/school/students?${params}`);
                if (res.ok) {
                    const result = await res.json();
                    setStudentsList(result.students);
                    setStudentTotalPages(result.pagination.totalPages);
                }
            } catch (err) {
                console.error("Failed to fetch students:", err);
            } finally {
                setLoadingStudents(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchStudents();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [data?.school.id, studentPage, studentSearch]);

    const handleCreateInvite = async (role: 'student' | 'teacher', classroomId?: string) => {
        setCreatingInvite(true);
        try {
            const res = await fetch('/api/schools/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schoolId: data?.school.id,
                    classroomId,
                    role
                })
            });
            const invite = await res.json();
            if (role === 'teacher') {
                setTeacherInviteCode(invite.code);
            } else {
                setInviteCode(invite.code);
                // Also set it for the class-specific view if applicable
                setInviteCodeForClass(invite.code);
            }
        } catch (err) {
            alert('Failed to create invite');
        } finally {
            setCreatingInvite(false);
        }
    };

    const handleOpenInviteModal = (classroomId: string, className: string) => {
        setInviteClassName(className);
        setInviteCodeForClass('');
        setShowInviteModal(true);
        handleCreateInvite('student', classroomId);
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName) return;

        setCreatingClass(true);
        try {
            const res = await fetch('/api/dashboard/school/classrooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newClassName,
                    startDate: newClassStartDate || null,
                    endDate: newClassEndDate || null
                })
            });

            if (res.ok) {
                // Refresh data
                const refreshed = await fetch('/api/dashboard/school').then(r => r.json());
                setData(refreshed);
                // Reset form and close modal
                setShowAddClassModal(false);
                setNewClassName('');
                setNewClassStartDate('');
                setNewClassEndDate('');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create classroom');
            }
        } catch (e) {
            console.error('Error creating classroom:', e);
            alert('An unexpected error occurred.');
        } finally {
            setCreatingClass(false);
        }
    };

    const handleOpenManageClass = (c: any) => {
        setSelectedClass(c);
        setManageClassName(c.name);
        setManageClassStartDate(c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '');
        setManageClassEndDate(c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '');
        setManageClassTeacherId(c.teacherId || '');
        setShowManageClassModal(true);
    };

    const handleUpdateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass || !manageClassName) return;

        setUpdatingClass(true);
        try {
            const res = await fetch(`/api/dashboard/school/classrooms/${selectedClass.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: manageClassName,
                    startDate: manageClassStartDate || null,
                    endDate: manageClassEndDate || null,
                    teacherId: manageClassTeacherId || null
                })
            });

            if (res.ok) {
                const refreshed = await fetch('/api/dashboard/school').then(r => r.json());
                setData(refreshed);
                setShowManageClassModal(false);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update classroom');
            }
        } catch (e) {
            console.error('Error updating classroom:', e);
            alert('An unexpected error occurred.');
        } finally {
            setUpdatingClass(false);
        }
    };

    const handleDeleteClass = async () => {
        if (!selectedClass) return;
        if (!confirm(isTamil ? 'இந்த வகுப்பை நீக்க விரும்புகிறீர்களா? இது அனைத்து மாணவர் இணைப்புகளையும் நீக்கிவிடும்.' : 'Are you sure you want to delete this classroom? This will remove all student assignments to this class.')) return;

        setDeletingClass(true);
        try {
            const res = await fetch(`/api/dashboard/school/classrooms/${selectedClass.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                const refreshed = await fetch('/api/dashboard/school').then(r => r.json());
                setData(refreshed);
                setShowManageClassModal(false);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to delete classroom');
            }
        } catch (e) {
            console.error('Error deleting classroom:', e);
            alert('An unexpected error occurred.');
        } finally {
            setDeletingClass(false);
        }
    };

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherEmail) return;

        setAddingTeacher(true);
        try {
            const res = await fetch('/api/dashboard/school/add-teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: teacherEmail })
            });

            if (res.ok) {
                const refreshed = await fetch('/api/dashboard/school').then(r => r.json());
                setData(refreshed);
                setTeacherEmail('');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add teacher');
            }
        } catch (e) {
            console.error('Error adding teacher:', e);
            alert('An unexpected error occurred.');
        } finally {
            setAddingTeacher(false);
        }
    };

    const handlePromoteTeacher = async (teacherId: string) => {
        if (!confirm(isTamil ? 'இந்த ஆசிரியரை நிர்வாகியாக மாற்ற விரும்புகிறீர்களா?' : 'Are you sure you want to promote this teacher to School Admin?')) return;

        try {
            const res = await fetch('/api/dashboard/school/promote-teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId })
            });

            if (res.ok) {
                const refreshed = await fetch('/api/dashboard/school').then(r => r.json());
                setData(refreshed);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to promote teacher');
            }
        } catch (e) {
            console.error('Error promoting teacher:', e);
            alert('An unexpected error occurred.');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center max-w-md">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800">{error}</h2>
                <Link href="/" className="mt-6 inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold">Back Home</Link>
            </div>
        </div>
    );

    if (!data) return null;

    const isPaid = user?.tier === 'paid';

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
            <PageHeader
                gradientClass="bg-gradient-to-r from-purple-800 to-indigo-900"
                onLoginClick={() => setShowAuthModal(true)}
                onUpgradeClick={() => setShowPricingModal(true)}
                onBadgesClick={() => setShowBadgeModal(true)}
                isTamil={isTamil}
                toggleLanguage={toggleLanguage}
                alignLeft={true}
                hideSubBar={true}
                maxWidthClass="max-w-full px-4 sm:px-8"
            />



            <PricingModal
                isOpen={showPricingModal}
                onClose={() => setShowPricingModal(false)}
                isTamil={isTamil}
            />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                isTamil={isTamil}
            />

            <BadgeModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                language={isTamil ? 'tamil' : 'english'}
                celebrationType={null}
            />
            {/* Header hero area */}
            <div className="w-full pt-8 pb-12 shadow-sm border-b border-gray-100 bg-white">
                <div className="w-full px-4 sm:px-8 flex flex-col md:flex-row md:items-center gap-6">
                    {/* Logo (Only if exists) */}
                    {data.school.logo && (
                        <div className="h-24 w-24 rounded-2xl bg-white shadow-sm p-2 border border-gray-200 overflow-hidden shrink-0">
                            <img src={data.school.logo} alt="" className="w-full h-full object-contain" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">Academy Dashboard</span>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm border border-emerald-200">Active Subscription</span>
                        </div>

                        <div className="flex items-center gap-3 mb-1 group/edit">
                            {isEditingName ? (
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (editNameValue && editNameValue !== data.school.name) {
                                            try {
                                                const res = await fetch(`/api/schools/${data.school.id}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ name: editNameValue })
                                                });
                                                if (res.ok) {
                                                    setData({ ...data, school: { ...data.school, name: editNameValue } });
                                                }
                                            } catch (e) {
                                                alert('Failed to update school');
                                            }
                                        }
                                        setIsEditingName(false);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={editNameValue}
                                        onChange={(e) => setEditNameValue(e.target.value)}
                                        className="text-3xl md:text-5xl font-black text-gray-900 bg-white border border-purple-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-4 focus:ring-purple-500/50 w-full max-w-[450px]"
                                        autoFocus
                                        onBlur={() => setIsEditingName(false)}
                                    />
                                    <button type="submit" className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors">✓</button>
                                </form>
                            ) : (
                                <>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900">{data.school.name}</h1>
                                    <button
                                        onClick={() => {
                                            setEditNameValue(data.school.name);
                                            setIsEditingName(true);
                                        }}
                                        className="text-gray-400 hover:text-purple-600 opacity-0 group-hover/edit:opacity-100 transition-all p-2 text-xl"
                                        title={isTamil ? "பெயரை மாற்றவும்" : "Edit Name"}
                                    >
                                        ✏️
                                    </button>
                                </>
                            )}
                        </div>

                        <p className="text-gray-500 mt-2 text-sm font-medium">
                            Managed by {user?.name} • ID: <span className="font-mono bg-gray-100 text-gray-600 px-1 py-0.5 rounded border border-gray-200">{data.school.id}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 pt-8 relative z-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-4 mb-10">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-purple-600 transition-colors uppercase">{isTamil ? 'மாணவர்கள்' : 'Students'}</div>
                            <div className="text-2xl font-black text-gray-900">{data.stats.students}</div>
                        </div>
                        <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-purple-100 uppercase">👦</div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors uppercase">{isTamil ? 'ஆசிரியர்கள்' : 'Staff'}</div>
                            <div className="text-2xl font-black text-gray-900">{data.stats.staff}</div>
                        </div>
                        <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-indigo-100 uppercase">👩‍🏫</div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-amber-600 transition-colors uppercase">{isTamil ? 'வகுப்புகள்' : 'Classes'}</div>
                            <div className="text-2xl font-black text-gray-900">{data.stats.classrooms}</div>
                        </div>
                        <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-amber-100 uppercase">🏫</div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-emerald-600 transition-colors">{isTamil ? 'சராசரி மதிப்பெண்' : 'Avg Score'}</div>
                            <div className="text-2xl font-black text-gray-900">{isTamil ? 'மிக விரைவில்' : 'Coming Soon'}</div>
                        </div>
                        <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-emerald-100 uppercase">📈</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Classrooms & Management */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Staff Section */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{isTamil ? 'ஆசிரியர்கள் & பணியாளர்கள்' : 'Staff & Teachers'} 👨‍🏫</h2>
                            </div>
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <form onSubmit={handleAddTeacher} className="p-4 bg-gray-50/50 border-b border-gray-100 flex gap-3">
                                    <input
                                        type="email"
                                        placeholder={isTamil ? 'ஆசிரியரின் மின்னஞ்சல்' : "Teacher's Email"}
                                        value={teacherEmail}
                                        onChange={(e) => setTeacherEmail(e.target.value)}
                                        className="flex-grow bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={addingTeacher}
                                        className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        {addingTeacher ? '...' : (isTamil ? 'சேர்' : 'Add')}
                                    </button>
                                </form>
                                <div className="divide-y divide-gray-50">
                                    {data.staff.map(member => (
                                        <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg border border-indigo-100 overflow-hidden shrink-0">
                                                    {member.picture ? <img src={member.picture} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : '👨‍🏫'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{member.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">{member.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-start sm:self-auto ml-13 sm:ml-0">
                                                {member.role === 'teacher' && (
                                                    <button
                                                        onClick={() => handlePromoteTeacher(member.id)}
                                                        className="text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors shadow-sm"
                                                    >
                                                        {isTamil ? 'நிர்வாகியாக மாற்று' : 'Promote to Admin'}
                                                    </button>
                                                )}
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-md border ${member.role === 'school_admin'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                    }`}>
                                                    {member.role === 'school_admin' ? (isTamil ? 'நிர்வாகி' : 'Admin') : (isTamil ? 'ஆசிரியர்' : 'Teacher')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{isTamil ? 'வகுப்பறைகள்' : 'Classrooms'}</h2>
                                <div className="flex items-center gap-2">
                                    <div className="bg-gray-100 p-1 rounded-xl flex">
                                        <button
                                            onClick={() => setClassroomTab('active')}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${classroomTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {isTamil ? 'தற்போதைய' : 'Active'}
                                        </button>
                                        <button
                                            onClick={() => setClassroomTab('completed')}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${classroomTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {isTamil ? 'முடிந்தவை' : 'Completed'}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setShowAddClassModal(true)}
                                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold px-3 py-1.5 rounded-xl transition-colors text-xs border border-purple-100 uppercase tracking-widest whitespace-nowrap"
                                    >
                                        + {isTamil ? 'புதிய' : 'New'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(() => {
                                    const filteredClassrooms = data.classrooms.filter(c => {
                                        const end = c.endDate ? new Date(c.endDate) : null;
                                        if (classroomTab === 'active') {
                                            return !end || end >= new Date();
                                        } else {
                                            return end && end < new Date();
                                        }
                                    });

                                    if (filteredClassrooms.length === 0) {
                                        return (
                                            <div className="col-span-2 bg-gray-50 border-2 border-dashed border-gray-200 p-12 rounded-3xl text-center text-gray-400 font-bold">
                                                {classroomTab === 'active'
                                                    ? (isTamil ? 'தற்போதைய வகுப்புகள் இல்லை.' : 'No active classrooms found.')
                                                    : (isTamil ? 'முடிவடைந்த வகுப்புகள் இல்லை.' : 'No completed classrooms yet.')}
                                            </div>
                                        );
                                    }

                                    return filteredClassrooms.map(c => (
                                        <div key={c.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-100 transition-all group relative overflow-hidden">
                                            {classroomTab === 'completed' && (
                                                <div className="absolute -right-6 top-4 bg-gray-200 text-gray-600 text-[9px] font-black uppercase tracking-widest py-1 px-8 rotate-45 shadow-sm">Completed</div>
                                            )}
                                            <div className="flex items-center justify-between mb-4 pr-6">
                                                <h3 className="text-lg font-black text-gray-900 group-hover:text-purple-700 transition-colors uppercase tracking-tight">{c.name}</h3>
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium space-y-2.5 mb-6">
                                                <div className="flex items-center gap-2">👨‍🏫 Teacher: {c.teacherName || (isTamil ? 'யாரும் ஒதுக்கப்படவில்லை' : 'Not assigned')}</div>
                                                {c.startDate && <div className="flex items-center gap-2 opacity-80">📅 Starts: {new Date(c.startDate).toLocaleDateString()}</div>}
                                                {c.endDate && <div className="flex items-center gap-2 opacity-80">🏁 Ends: {new Date(c.endDate).toLocaleDateString()}</div>}
                                            </div>
                                            <div className="flex gap-2 relative z-10">
                                                <button
                                                    onClick={() => handleOpenManageClass(c)}
                                                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors border border-gray-200"
                                                >
                                                    {isTamil ? 'நிர்வகி' : 'Manage'}
                                                </button>
                                                {classroomTab === 'active' && (
                                                    <button
                                                        onClick={() => handleOpenInviteModal(c.id, c.name)}
                                                        className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors border border-purple-100 shadow-sm"
                                                    >
                                                        Invite
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </section>

                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{isTamil ? 'மாணவர் பட்டியல்' : 'Student Roster'}</h2>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={isTamil ? 'பெயர் அல்லது மின்னஞ்சல் தேடல்...' : 'Search name or email...'}
                                        value={studentSearch}
                                        onChange={(e) => {
                                            setStudentSearch(e.target.value);
                                            setStudentPage(1); // Reset to page 1 on search
                                        }}
                                        className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow shadow-sm"
                                    />
                                    <span className="absolute left-3.5 top-2.5 text-gray-400">🔍</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[300px]">
                                {loadingStudents && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                                    </div>
                                )}

                                {studentsList.length === 0 && !loadingStudents ? (
                                    <div className="p-10 text-center text-gray-400 font-medium">
                                        {studentSearch ? 'No students found matching your search.' : 'No students joined yet. Use the invite section to bring them in!'}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50 pb-4">
                                        {studentsList.map(u => (
                                            <div key={u.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl overflow-hidden shadow-inner flex-shrink-0 border border-purple-100">
                                                        {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : '🧒'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors tracking-tight">{u.name}</div>
                                                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 sm:gap-2">
                                                            <span className="truncate max-w-[100px] sm:max-w-[200px]">{u.email}</span>
                                                            <span className="h-1 w-1 bg-gray-300 rounded-full shrink-0"></span>
                                                            <span className="shrink-0">{new Date(u.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className={`text-[9px] sm:text-[10px] px-2.5 sm:px-3 py-1 rounded-md font-bold uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100`}>
                                                        Student
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Pagination Controls */}
                                        {studentTotalPages > 1 && (
                                            <div className="flex items-center justify-between px-6 pt-4 mt-2 border-t border-gray-50">
                                                <button
                                                    onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                                                    disabled={studentPage === 1}
                                                    className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:hover:bg-gray-50 transition-colors"
                                                >
                                                    {isTamil ? 'முந்தைய' : 'Previous'}
                                                </button>
                                                <span className="text-xs font-bold text-gray-400">
                                                    Page {studentPage} of {studentTotalPages}
                                                </span>
                                                <button
                                                    onClick={() => setStudentPage(p => Math.min(studentTotalPages, p + 1))}
                                                    disabled={studentPage === studentTotalPages}
                                                    className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:hover:bg-gray-50 transition-colors"
                                                >
                                                    {isTamil ? 'அடுத்தது' : 'Next'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Actions & Invites */}
                    {/* Support column removed from here */}
                </div>
            </main>

            {/* Footer Support Section */}
            <footer className="w-full bg-white border-t border-gray-100 py-16 mt-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col items-center text-center">
                    <div className="bg-amber-50/50 rounded-[2.5rem] p-8 sm:p-12 border border-amber-100 max-w-3xl w-full shadow-sm group hover:shadow-md transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-[0.03] text-9xl pointer-events-none transform translate-x-8 -translate-y-8 group-hover:rotate-12 transition-transform duration-700">🛡️</div>
                        <h4 className="font-black text-amber-900 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] mb-6">
                            <span className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-sm shadow-inner">🛡️</span>
                            {isTamil ? 'நிர்வாக உதவி மையம்' : 'Admin Support Center'}
                        </h4>
                        <p className="text-gray-600 font-bold text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                            {isTamil ? (
                                <>ஏதேனும் உதவி தேவையா அல்லது உங்கள் பள்ளி சந்தாவைப் பற்றி வினவ வேண்டுமா? தயவுசெய்து எங்களை <a href="mailto:thirukuraliq@gmail.com" className="text-purple-600 hover:text-purple-800 font-black underline underline-offset-4 decoration-purple-200 hover:decoration-purple-600 transition-all">thirukuraliq@gmail.com</a> இல் தொடர்பு கொள்ளவும்.</>
                            ) : (
                                <>Need technical assistance or have questions about your academy subscription? Please reach out to our team at <a href="mailto:thirukuraliq@gmail.com" className="text-purple-600 hover:text-purple-800 font-black underline underline-offset-4 decoration-purple-200 hover:decoration-purple-600 transition-all">thirukuraliq@gmail.com</a></>
                            )}
                        </p>
                    </div>
                    <div className="mt-12 text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        © {new Date().getFullYear()} Thirukkural Mastery • Powered by ThirukkuralIQ
                    </div>
                </div>
            </footer>

            {/* Add Class Modal */}
            {showAddClassModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900">{isTamil ? 'புதிய வகுப்பு' : 'Create New Class'}</h3>
                            <button onClick={() => setShowAddClassModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">{isTamil ? 'வகுப்பு பெயர்' : 'Class Name'} *</label>
                                <input
                                    type="text"
                                    required
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    placeholder="e.g. Fall 2026 Batch"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">{isTamil ? 'தொடக்க தேதி' : 'Start Date'}</label>
                                    <input
                                        type="date"
                                        value={newClassStartDate}
                                        onChange={(e) => setNewClassStartDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-600 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">{isTamil ? 'முடிவு தேதி' : 'End Date'}</label>
                                    <input
                                        type="date"
                                        value={newClassEndDate}
                                        onChange={(e) => setNewClassEndDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-600 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddClassModal(false)}
                                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                                >
                                    {isTamil ? 'ரத்து' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingClass || !newClassName}
                                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm shadow-md flex justify-center items-center"
                                >
                                    {creatingClass ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (isTamil ? 'உருவாக்கு' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-fade-in-up text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-purple-100">🎫</div>
                            <h3 className="text-xl font-black text-gray-900">{isTamil ? 'அழைப்பு குறியீடு' : 'Invite Code'}</h3>
                            <p className="text-gray-500 text-sm font-medium mt-1">{inviteClassName}</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 mb-6">
                            {creatingInvite ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin"></div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generating...</div>
                                </div>
                            ) : (
                                <div className="text-4xl sm:text-5xl font-black tracking-widest font-mono text-purple-700">{inviteCodeForClass}</div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    const link = `${window.location.origin}/join/${inviteCodeForClass}`;
                                    navigator.clipboard.writeText(link);
                                    alert(isTamil ? 'இணைப்பு நகலெடுக்கப்பட்டது!' : 'Invite link copied to clipboard!');
                                }}
                                disabled={!inviteCodeForClass}
                                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {isTamil ? 'இணைப்பை நகலெடு' : 'Copy Invite Link'}
                            </button>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="w-full bg-gray-50 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm"
                            >
                                {isTamil ? 'மூடு' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Class Modal */}
            {showManageClassModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900">{isTamil ? 'வகுப்பை நிர்வகி' : 'Manage Classroom'}</h3>
                            <button onClick={() => setShowManageClassModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateClass} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">{isTamil ? 'வகுப்பு பெயர்' : 'Class Name'} *</label>
                                <input
                                    type="text"
                                    required
                                    value={manageClassName}
                                    onChange={(e) => setManageClassName(e.target.value)}
                                    placeholder="e.g. Fall 2026 Batch"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">{isTamil ? 'ஆசிரியர்' : 'Teacher'}</label>
                                <select
                                    value={manageClassTeacherId}
                                    onChange={(e) => setManageClassTeacherId(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-gray-700"
                                >
                                    <option value="">{isTamil ? 'யாரும் ஒதுக்கப்படவில்லை' : 'Not Assigned'}</option>
                                    {data.staff.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.name} ({member.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">{isTamil ? 'தொடக்க தேதி' : 'Start Date'}</label>
                                    <input
                                        type="date"
                                        value={manageClassStartDate}
                                        onChange={(e) => setManageClassStartDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-600 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">{isTamil ? 'முடிவு தேதி' : 'End Date'}</label>
                                    <input
                                        type="date"
                                        value={manageClassEndDate}
                                        onChange={(e) => setManageClassEndDate(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-600 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowManageClassModal(false)}
                                        className="flex-1 px-4 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        {isTamil ? 'ரத்து' : 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updatingClass || !manageClassName}
                                        className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm shadow-md flex justify-center items-center"
                                    >
                                        {updatingClass ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (isTamil ? 'புதுப்பி' : 'Update')}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDeleteClass}
                                    disabled={deletingClass}
                                    className="w-full px-4 py-3.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors text-sm border border-red-100"
                                >
                                    {deletingClass ? 'Deleting...' : (isTamil ? 'வகுப்பை நீக்கு' : 'Delete Classroom')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
