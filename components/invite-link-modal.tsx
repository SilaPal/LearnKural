'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface InviteLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteLink: string;
    classroomName?: string;
    isTamil?: boolean;
}

export default function InviteLinkModal({ isOpen, onClose, inviteLink, classroomName, isTamil = false }: InviteLinkModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                    <div className="p-6 sm:p-8 text-center">
                        <div className="flex justify-end mb-2">
                            <Dialog.Close className="h-10 w-10 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all">
                                <X size={20} className="stroke-[3]" />
                            </Dialog.Close>
                        </div>

                        <div className="text-6xl mb-6">🔗</div>

                        <Dialog.Title className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                            {isTamil ? 'அழைப்பு இணைப்பு தயார்!' : 'Invite Link Ready!'}
                        </Dialog.Title>

                        <Dialog.Description className="text-gray-500 font-medium mb-8 leading-relaxed">
                            {isTamil
                                ? `${classroomName ? `${classroomName} வகுப்புக்கு` : 'உங்கள் பள்ளிக்கு'} பெற்றோர்கள் மற்றும் மாணவர்களை அழைக்க இந்த இணைப்பைப் பகிரவும்.`
                                : `Share this magic link with parents to invite students to ${classroomName ? `your ${classroomName} class` : 'your school'}.`}
                            <br /><br />
                            <span className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-600 font-bold uppercase tracking-wider">
                                {isTamil ? 'வாட்ஸ்அப் அல்லது ஈமெயில் மூலம் பகிரலாம்' : 'Share via WhatsApp, Email, etc.'}
                            </span>
                        </Dialog.Description>

                        <div className="bg-gray-50 p-2 sm:p-3 rounded-2xl flex items-center border-2 border-gray-100 relative group overflow-hidden">
                            <div className="flex-1 overflow-hidden">
                                <div className="truncate px-4 text-sm font-medium text-gray-600 w-full text-left font-mono">
                                    {inviteLink}
                                </div>
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ml-2 flex-shrink-0 ${copied
                                        ? 'bg-emerald-100 text-emerald-700 pointer-events-none'
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                                    }`}
                            >
                                {copied ? <><Check size={18} className="stroke-[3]" /> {isTamil ? 'நகலெடுக்கப்பட்டது' : 'Copied!'}</> : <><Copy size={18} className="stroke-[3]" /> {isTamil ? 'நகலெடு' : 'Copy'}</>}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
