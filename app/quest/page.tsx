import { getAllKurals } from '@/lib/kurals';
import QuestClient from './quest-client';

export const metadata = {
    title: 'Kural Quest | Gamified Learning Map',
    description: 'Embark on a gamified journey through the 133 chapters of Thirukkural.',
};

export default async function QuestPage() {
    const kurals = await getAllKurals();

    // Group into Kingdoms (Sections) -> Chapters (Nodes)
    const kingdomsRaw: Record<string, any[]> = {};

    kurals.forEach(kural => {
        const sectionEn = kural.section_english || 'Unknown';
        const sectionTa = kural.section_tamil || 'அறியப்படாத';
        const sectionKey = sectionEn; // Aram, Porul, Inbam

        if (!kingdomsRaw[sectionKey]) {
            kingdomsRaw[sectionKey] = [];
        }

        // Find if chapter already added to this kingdom
        let chapter = kingdomsRaw[sectionKey].find(c => c.chapter_en === kural.subsection_english);
        if (!chapter) {
            chapter = {
                chapter_number: kingdomsRaw[sectionKey].length + 1, // Will recount globally below
                chapter_ta: kural.subsection_tamil || 'அத்தியாயம்',
                chapter_en: kural.subsection_english || 'Chapter',
                firstKuralId: kural.id,
            };
            kingdomsRaw[sectionKey].push(chapter);
        }
    });

    // Reorder and assign global chapter numbers 1-133
    // Ordered explicitly as Aram, Porul, Inbam
    const sectionOrder = ['Virtue', 'Wealth', 'Love']; // Standard translations for Aram, Porul, Inbam
    const kingdoms = [];
    let globalChapterCount = 1;

    for (const s of sectionOrder) {
        // If exact name differs, we might need to find by partial match
        const key = Object.keys(kingdomsRaw).find(k => k.toLowerCase().includes(s.toLowerCase()));
        if (key && kingdomsRaw[key]) {
            const nodes = kingdomsRaw[key].map(ch => ({
                ...ch,
                chapter_number: globalChapterCount++
            }));
            kingdoms.push({
                id: key.toLowerCase(),
                name_en: key,
                name_ta: kurals.find(k => k.section_english === key)?.section_tamil || '',
                nodes
            });
        }
    }

    return <QuestClient kingdoms={kingdoms} />;
}
