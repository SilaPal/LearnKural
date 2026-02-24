'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';

interface AvatarItem {
    id: string;
    name: string;
    imageUrl: string;
}

interface ReactingAvatarProps {
    emotion: 'idle' | 'happy' | 'sad' | 'excited' | 'thinking';
    className?: string;
}

export default function ReactingAvatar({ emotion, className = '' }: ReactingAvatarProps) {
    const { user } = useAuth();
    const [activeAvatarId, setActiveAvatarId] = useState('default');
    const [avatarImage, setAvatarImage] = useState('🧒');

    useEffect(() => {
        if (user) {
            // Fetch user active avatar ID
            fetch('/api/user/avatar')
                .then(res => res.json())
                .then(data => {
                    if (data?.activeAvatarId) {
                        setActiveAvatarId(data.activeAvatarId);
                        if (data.activeAvatarId !== 'default') {
                            // Fetch the actual image for it from the catalog
                            fetch('/api/sandhai').then(r => r.json()).then(sandhai => {
                                const av = sandhai.catalog.find((a: AvatarItem) => a.id === data.activeAvatarId);
                                if (av) setAvatarImage(av.imageUrl);
                            });
                        } else {
                            setAvatarImage('🧒');
                        }
                    }
                }).catch(err => console.error(err));
        }
    }, [user]);

    // Define simple CSS animations based on the emotion prop
    let animationClass = '';
    let particle = null;

    switch (emotion) {
        case 'happy':
            animationClass = 'animate-bounce';
            particle = '✨';
            break;
        case 'excited':
            animationClass = 'animate-bounce scale-110 rotate-6';
            particle = '🎉';
            break;
        case 'sad':
            animationClass = 'grayscale opacity-75 translate-y-2';
            particle = '💧';
            break;
        case 'thinking':
            animationClass = 'animate-pulse -rotate-6';
            particle = '💭';
            break;
        case 'idle':
        default:
            animationClass = 'hover:-translate-y-1 transition-transform';
            break;
    }

    if (!user) return null;

    return (
        <div className={`relative inline-block transition-all duration-300 ${animationClass} ${className}`}>
            <div className="text-6xl drop-shadow-lg z-10 relative bg-white/50 backdrop-blur-sm p-2 rounded-full border-4 border-orange-200">
                {avatarImage}
            </div>

            {particle && (
                <div className="absolute -top-4 -right-4 text-3xl animate-ping opacity-75 pointer-events-none">
                    {particle}
                </div>
            )}
        </div>
    );
}
