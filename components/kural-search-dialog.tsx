'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { KuralSlugMap } from '@/components/navigation-modal';

interface KuralSearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    allKuralSlugs: KuralSlugMap[];
    isTamil: boolean;
}

export function KuralSearchDialog({ isOpen, onClose, allKuralSlugs, isTamil }: KuralSearchDialogProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery(''); // Reset query on close
        }
    }, [isOpen]);

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Filter kurals based on search query
    const filteredResults = useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase().trim();

        // Check if query is a number
        const isNumberQuery = !isNaN(Number(lowerQuery));

        let matched = allKuralSlugs.filter(kural => {
            if (isNumberQuery) {
                return kural.id.toString().includes(lowerQuery);
            }

            // Text search
            const tamilMatch = kural.kural_tamil?.toLowerCase().includes(lowerQuery) ||
                kural.subsection_tamil?.toLowerCase().includes(lowerQuery) ||
                kural.section_tamil?.toLowerCase().includes(lowerQuery) ||
                kural.meaning_tamil?.toLowerCase().includes(lowerQuery);

            const englishMatch = kural.kural_english?.toLowerCase().includes(lowerQuery) ||
                kural.subsection_english?.toLowerCase().includes(lowerQuery) ||
                kural.section_english?.toLowerCase().includes(lowerQuery) ||
                kural.meaning_english?.toLowerCase().includes(lowerQuery);

            return tamilMatch || englishMatch;
        });

        // Limit to 50 results to prevent rendering lag
        return matched.slice(0, 50);
    }, [query, allKuralSlugs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog content */}
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col transform transition-all max-h-[80vh]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="search-modal-title"
            >
                {/* Search header & input */}
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                    <svg className="h-6 w-6 text-indigo-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-transparent border-none focus:ring-0 text-lg sm:text-xl text-gray-800 placeholder-gray-400 p-0"
                        placeholder={isTamil ? "குறள் எண், அதிகாரம் அல்லது சொற்களைத் தேடுங்கள்..." : "Search by number, chapter, or text..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors shrink-0"
                        aria-label="Close search"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Results area */}
                <div className="overflow-y-auto flex-1 p-2 sm:p-4 bg-gray-50/50">
                    {!query.trim() ? (
                        <div className="text-center py-12 px-4 text-gray-500">
                            <span className="text-4xl mb-4 block">📚</span>
                            <p>{isTamil ? "நீங்கள் தேட விரும்பும் தட்டச்சு செய்யவும்." : "Start typing to search across all 1330 Kurals."}</p>
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="text-center py-12 px-4 text-gray-500">
                            <span className="text-4xl mb-4 block animate-bounce">🙈</span>
                            <p>
                                {isTamil
                                    ? `"${query}" தொடர்பான முடிவுகள் எதுவும் கிடைக்கவில்லை.`
                                    : `No results found for "${query}".`}
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2 pb-4">
                            {filteredResults.map((kural) => (
                                <li key={kural.id}>
                                    <Link
                                        href={`/kural-learning/${kural.slug}`}
                                        className="block hover:bg-white bg-transparent p-3 sm:p-4 rounded-xl transition-all hover:shadow-md border border-transparent hover:border-indigo-100 group"
                                        onClick={onClose}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-md">
                                                        #{kural.id}
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-500">
                                                        {isTamil ? kural.section_tamil : kural.section_english} • {isTamil ? kural.subsection_tamil : kural.subsection_english}
                                                    </span>
                                                </div>
                                                <p className="text-gray-800 font-tamil font-bold line-clamp-2">
                                                    {isTamil ? kural.kural_tamil?.replace(/\\n/g, ' ') : kural.kural_english}
                                                </p>
                                            </div>
                                            <svg className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 shrink-0 mt-2 transition-colors transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 18l6-6-6-6" />
                                            </svg>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
