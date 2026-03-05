'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar } from 'lucide-react';

interface CreateClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (classroom: any) => void;
    isTamil?: boolean;
}

export default function CreateClassModal({ isOpen, onClose, onSuccess, isTamil = false }: CreateClassModalProps) {
    const [name, setName] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/schools/classrooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, endDate: endDate || null })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                onSuccess(data.classroom);
                setName('');
                setEndDate('');
            } else {
                setError(data.error || 'Failed to create class');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500"></div>

                    <div className="p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <Dialog.Title className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <span className="text-3xl">🏫</span>
                                {isTamil ? 'புதிய வகுப்பு உருவாக்கு' : 'Create New Class'}
                            </Dialog.Title>
                            <Dialog.Close className="h-10 w-10 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all disabled:opacity-50">
                                <X size={20} className="stroke-[3]" />
                            </Dialog.Close>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    {isTamil ? 'வகுப்பு பெயர்' : 'Class Name'}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={isTamil ? 'எ.கா. வகுப்பு 1' : 'e.g. Grade 1'}
                                    autoFocus
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium text-gray-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    <Calendar size={16} />
                                    {isTamil ? 'முடிவு தேதி (விருப்பத்தேர்வு)' : 'End Date (Optional)'}
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium text-gray-900"
                                />
                                <p className="text-xs text-gray-500 font-medium mt-2">
                                    {isTamil
                                        ? 'உங்கள் உள்ளூர் காலண்டரின் அடிப்படையில் வகுப்பின் கடைசி நாஅளைத் தேர்ந்தெடுக்கவும்.'
                                        : 'Select the last day of the class based on your local calendar.'}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="w-full mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 px-6 rounded-2xl hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:hover:shadow-none translate-y-0 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {loading ? (isTamil ? 'உருவாக்குகிறது...' : 'Creating...') : (isTamil ? 'வகுப்பை உருவாக்கு' : 'Create Class')}
                            </button>
                        </form>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
