'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface InviteLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteLink: string;
    inviteCode?: string;
    classroomName?: string;
    isTamil?: boolean;
}

export default function InviteLinkModal({ isOpen, onClose, inviteLink, inviteCode, classroomName, isTamil = false }: InviteLinkModalProps) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    // If inviteCode isn't provided, try to extract it from the link
    const displayCode = inviteCode || inviteLink.split('/').pop() || '';

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(displayCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500"></div>

                    <div className="p-6 sm:p-10 text-center">
                        <div className="flex justify-end mb-2 absolute top-6 right-6">
                            <Dialog.Close className="h-10 w-10 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all">
                                <X size={20} className="stroke-[3]" />
                            </Dialog.Close>
                        </div>

                        <div className="text-6xl mb-6">🔗</div>

                        <Dialog.Title className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                            {isTamil ? 'அழைப்பு தயார்!' : 'Invite Ready!'}
                        </Dialog.Title>

                        <p className="text-gray-500 font-medium mb-8 text-sm">
                            {isTamil
                                ? `${classroomName ? `${classroomName} வகுப்புக்கு` : 'உங்கள் பள்ளிக்கு'} மாணவர்களை அழைக்கவும்.`
                                : `Invite students to ${classroomName ? `your ${classroomName} class` : 'your school'}.`}
                        </p>

                        <div className="space-y-6">
                            {/* Option 1: The Magic Link */}
                            <div>
                                <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 text-left px-2">
                                    {isTamil ? 'அழைப்பு இணைப்பு' : 'Invite Link (Recommended)'}
                                </label>
                                <div className="bg-purple-50 p-2 sm:p-3 rounded-2xl flex items-center border border-purple-100 relative group overflow-hidden">
                                    <div className="flex-1 overflow-hidden">
                                        <div className="truncate px-4 text-xs font-bold text-purple-700 w-full text-left font-mono">
                                            {inviteLink}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ml-2 flex-shrink-0 text-xs ${copiedLink
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-600 hover:text-white'
                                            }`}
                                    >
                                        {copiedLink ? <><Check size={14} className="stroke-[3]" /> {isTamil ? 'நகலானது' : 'Copied!'}</> : <><Copy size={14} className="stroke-[3]" /> {isTamil ? 'லிங்க்' : 'Link'}</>}
                                    </button>
                                </div>
                            </div>

                            {/* Option 2: The Invite Code */}
                            <div>
                                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 text-left px-2">
                                    {isTamil ? 'அழைப்பு குறியீடு' : 'Invite Code'}
                                </label>
                                <div className="bg-indigo-50 p-2 sm:p-3 rounded-2xl flex items-center border border-indigo-100 relative group overflow-hidden">
                                    <div className="flex-1 text-center py-1">
                                        <div className="text-2xl font-black text-indigo-700 tracking-[0.2em] font-mono">
                                            {displayCode}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCopyCode}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ml-2 flex-shrink-0 text-xs ${copiedCode
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white'
                                            }`}
                                    >
                                        {copiedCode ? <><Check size={14} className="stroke-[3]" /> {isTamil ? 'நகலானது' : 'Copied!'}</> : <><Copy size={14} className="stroke-[3]" /> {isTamil ? 'குறியீடு' : 'Code'}</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-100">
                            <button
                                onClick={onClose}
                                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-95"
                            >
                                {isTamil ? 'சரி' : 'Done'}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
