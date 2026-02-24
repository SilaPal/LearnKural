import { Kural } from '../shared/schema';

const GITHUB_CSV_URL = "https://raw.githubusercontent.com/Thirukuraliq/LearnKural/refs/heads/main/Thirukural.csv";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for development

let cachedKurals: Kural[] | null = null;
let cacheTimestamp = 0;

function parseCSV(csvText: string): string[][] {
  const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = normalizedText.split('\n');
  return rows.map(row => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }).filter(row => row.some(cell => cell.length > 0));
}

function convertGitHubUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.includes('github.com') && url.includes('blob/')) {
    return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }
  return url;
}

function convertYouTubeUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  return url;
}

export async function getAllKurals(): Promise<Kural[]> {
  const now = Date.now();
  
  if (cachedKurals && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedKurals;
  }
  
  try {
    const response = await fetch(GITHUB_CSV_URL, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) {
      throw new Error('Invalid CSV data');
    }
    
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);
    
    const getColumnIndex = (name: string): number => {
      return headers.findIndex(h => h === name.toLowerCase());
    };
    
    const idIdx = getColumnIndex('id');
    const kuralTamilIdx = getColumnIndex('kural_tamil');
    const kuralEnglishIdx = getColumnIndex('kural_english');
    const meaningTamilIdx = getColumnIndex('meaning_tamil');
    const meaningEnglishIdx = getColumnIndex('meaning_english');
    const audioTamilIdx = getColumnIndex('audio_tamil_url');
    const audioEnglishIdx = getColumnIndex('audio_english_url');
    const youtubeTamilIdx = getColumnIndex('youtube_tamil_url');
    const youtubeEnglishIdx = getColumnIndex('youtube_english_url');
    const uriIdx = getColumnIndex('uri');
    const sectionEnglishIdx = getColumnIndex('section_english');
    const sectionTamilIdx = getColumnIndex('section_tamil');
    const subsectionEnglishIdx = getColumnIndex('subsection_english');
    const subsectionTamilIdx = getColumnIndex('subsection_tamil');
    
    function createSlug(uri: string | null, sectionEnglish: string | null, kuralId: number): string {
      if (uri && uri.trim()) {
        return `${uri.trim().toLowerCase().replace(/\s+/g, '-')}-${kuralId}`;
      }
      if (sectionEnglish && sectionEnglish.trim()) {
        return `${sectionEnglish.trim().toLowerCase().replace(/\s+/g, '-')}-${kuralId}`;
      }
      return `kural-${kuralId}`;
    }
    
    const kurals: Kural[] = dataRows
      .map((row, index) => {
        const id = idIdx >= 0 ? row[idIdx] : '';
        const kural_tamil = kuralTamilIdx >= 0 ? row[kuralTamilIdx] : '';
        const kural_english = kuralEnglishIdx >= 0 ? row[kuralEnglishIdx] : '';
        const meaning_tamil = meaningTamilIdx >= 0 ? row[meaningTamilIdx] : '';
        const meaning_english = meaningEnglishIdx >= 0 ? row[meaningEnglishIdx] : '';
        const audio_tamil_url = audioTamilIdx >= 0 ? row[audioTamilIdx] : '';
        const audio_english_url = audioEnglishIdx >= 0 ? row[audioEnglishIdx] : '';
        const youtube_tamil_url = youtubeTamilIdx >= 0 ? row[youtubeTamilIdx] : '';
        const youtube_english_url = youtubeEnglishIdx >= 0 ? row[youtubeEnglishIdx] : '';
        const uri = uriIdx >= 0 ? row[uriIdx] : '';
        const section_english = sectionEnglishIdx >= 0 ? row[sectionEnglishIdx] : '';
        const section_tamil = sectionTamilIdx >= 0 ? row[sectionTamilIdx] : '';
        const subsection_english = subsectionEnglishIdx >= 0 ? row[subsectionEnglishIdx] : '';
        const subsection_tamil = subsectionTamilIdx >= 0 ? row[subsectionTamilIdx] : '';

        const kuralId = parseInt(id) || index + 1;
        
        return {
          id: kuralId,
          kural_tamil: kural_tamil || '',
          kural_english: kural_english || '',
          meaning_tamil: meaning_tamil || '',
          meaning_english: meaning_english || '',
          audio_tamil_url: convertGitHubUrl(audio_tamil_url),
          audio_english_url: convertGitHubUrl(audio_english_url),
          youtube_tamil_url: convertYouTubeUrl(youtube_tamil_url),
          youtube_english_url: convertYouTubeUrl(youtube_english_url),
          uri: uri?.trim() || null,
          section_english: section_english?.trim() || 'Other',
          section_tamil: section_tamil?.trim() || 'மற்றவை',
          subsection_english: subsection_english?.trim() || 'Other',
          subsection_tamil: subsection_tamil?.trim() || 'மற்றவை',
          slug: createSlug(uri, section_english, kuralId),
        };
      })
      .filter(kural => kural.id >= 1 && kural.id <= 1330 && kural.kural_tamil.trim() !== '');
    
    // Remove duplicates - keep first occurrence of each ID
    const uniqueKurals: Kural[] = [];
    const seenIds = new Set<number>();
    for (const kural of kurals) {
      if (!seenIds.has(kural.id)) {
        seenIds.add(kural.id);
        uniqueKurals.push(kural);
      }
    }
    
    cachedKurals = uniqueKurals;
    cacheTimestamp = now;
    
    return uniqueKurals;
  } catch (error) {
    console.error('Failed to fetch kurals:', error);
    if (cachedKurals) {
      return cachedKurals;
    }
    return [];
  }
}

export async function getKuralById(id: number): Promise<Kural | undefined> {
  const kurals = await getAllKurals();
  return kurals.find(k => k.id === id);
}

export async function getKuralBySlug(slug: string): Promise<Kural | undefined> {
  const kurals = await getAllKurals();
  return kurals.find(k => k.slug === slug);
}

export async function getKuralByIndex(index: number): Promise<Kural | undefined> {
  const kurals = await getAllKurals();
  return kurals[index];
}
