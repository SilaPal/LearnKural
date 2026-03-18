import { getAllKurals } from '@/lib/kurals';
import QuestClient from './quest-client';

export const metadata = {
    title: 'Kural Quest | Gamified Thirukkural Learning Map | திருக்குறள் பயண வரைபடம்',
    description: 'Embark on a gamified journey through all 133 chapters of Thirukkural. Explore the three kingdoms of Virtue (அறம்), Wealth (பொருள்), and Love (இன்பம்) and master each chapter.',
    alternates: { canonical: 'https://learnthirukkural.com/quest' },
    openGraph: {
        title: 'Kural Quest | Thirukkural Learning Adventure',
        description: 'Journey through 133 chapters of Thirukkural across 3 kingdoms. Learn Tamil wisdom through gamified adventure.',
        url: 'https://learnthirukkural.com/quest',
    },
};

export default async function QuestPage() {
    const kurals = await getAllKurals();

    const kingdomsRaw: Record<string, any[]> = {};

    kurals.forEach(kural => {
        const sectionEn = kural.section_english || 'Unknown';
        const sectionKey = sectionEn;

        if (!kingdomsRaw[sectionKey]) {
            kingdomsRaw[sectionKey] = [];
        }

        let chapter = kingdomsRaw[sectionKey].find(c => c.chapter_en === kural.subsection_english);
        if (!chapter) {
            chapter = {
                chapter_number: kingdomsRaw[sectionKey].length + 1,
                chapter_ta: kural.subsection_tamil || 'அத்தியாயம்',
                chapter_en: kural.subsection_english || 'Chapter',
                firstKuralId: kural.id,
                firstKuralSlug: kural.slug,
                firstKuralTamil: kural.kural_tamil,
                sectionTamil: kural.section_tamil,
            };
            kingdomsRaw[sectionKey].push(chapter);
        }
    });

    const sectionOrder = ['Virtue', 'Wealth', 'Love'];
    const kingdoms = [];
    let globalChapterCount = 1;

    for (const s of sectionOrder) {
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

    return (
        <>
            <QuestClient kingdoms={kingdoms} />

            <section className="sr-only" aria-label="Kural Quest description">
                <h1>Kural Quest — Thirukkural Gamified Learning Map | திருக்குறள் பயண வரைபடம்</h1>
                <p>
                    Kural Quest is a gamified learning adventure map that guides you through all 133 chapters
                    of Thirukkural by the poet-saint Thiruvalluvar. Progress through three kingdoms representing
                    the three books of Thirukkural — Virtue (அறத்துப்பால்), Wealth (பொருட்பால்), and Love (காமத்துப்பால்).
                    Each chapter is a node on the map that you unlock by completing quizzes and games.
                </p>

                <h2>The Three Kingdoms of Thirukkural — திருக்குறள் மூன்று பால்கள்</h2>

                {kingdoms.map(kingdom => (
                    <div key={kingdom.id}>
                        <h3>{kingdom.name_en} — {kingdom.name_ta}</h3>
                        <p>
                            The {kingdom.name_en} book of Thirukkural contains {kingdom.nodes.length} chapters
                            covering moral and ethical wisdom on the theme of {kingdom.name_en.toLowerCase()}.
                        </p>
                        <h4>Chapters in {kingdom.name_en} — {kingdom.name_ta} அதிகாரங்கள்</h4>
                        <ul>
                            {kingdom.nodes.slice(0, 15).map((node: any) => (
                                <li key={node.chapter_number}>
                                    <a href={`/kural-learning/${node.firstKuralSlug}`}>
                                        Chapter {node.chapter_number}: {node.chapter_en} — {node.chapter_ta}
                                    </a>
                                    {node.firstKuralTamil && (
                                        <p lang="ta">{node.firstKuralTamil.replace(/\\n/g, ' ')}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <h2>How Kural Quest Works</h2>
                <p>
                    Start your journey at Chapter 1 of the Virtue (அறம்) kingdom. Complete word puzzles and
                    quizzes for each Thirukkural verse to earn stars and unlock the next chapter. Progress
                    through all 133 chapters across all three kingdoms to become a Thirukkural master.
                    Each completed chapter earns XP points that appear on the global leaderboard.
                </p>
            </section>
        </>
    );
}
