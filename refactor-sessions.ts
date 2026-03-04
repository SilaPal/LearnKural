import fs from 'fs';
import path from 'path';

const API_DIR = path.join(process.cwd(), 'app/api');

const targetOldContent = `async function getUserId(request: NextRequest) {
    const session = request.cookies.get('thirukural-session')?.value;
    if (!session) return null;
    try {
        const { userId } = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
        return userId;
    } catch {
        return null;
    }
}`;

const newContent = `import { verifySession } from '@/lib/session';

async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;
    const session = verifySession(sessionToken);
    return session?.userId || null;
}`;

function processDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('route.ts')) {
            let content = fs.readFileSync(fullPath, 'utf-8');

            // Look for getUserId definition
            const regex = /async function getUserId\(request: NextRequest\) \{[\s\S]*?catch \{[\s\S]*?return null;[\s\S]*?\}[\s\S]*?\}/g;
            if (content.match(regex)) {

                content = content.replace(regex, `async function getUserId(request: NextRequest) {
    const sessionToken = request.cookies.get('thirukural-session')?.value;
    if (!sessionToken) return null;
    
    // Fallback block if old unassigned session cookie exists (temp backwards compatibility)
    try {
        if (!sessionToken.includes('.')) {
             const dec = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
             return dec.userId || null;
        }
    } catch {}

    const sessionData = verifySession(sessionToken);
    return sessionData?.userId || null;
}`);
                // now we need to add the import if it's missing
                if (!content.includes('verifySession') || !content.includes('@/lib/session')) {
                    // insert right after other imports
                    const lastImportIdx = content.lastIndexOf('import ');
                    let insertPos = 0;
                    if (lastImportIdx !== -1) {
                        insertPos = content.indexOf('\n', lastImportIdx) + 1;
                    }
                    content = content.slice(0, insertPos) + "import { verifySession } from '@/lib/session';\n" + content.slice(insertPos);
                }

                fs.writeFileSync(fullPath, content);
                console.log('Updated:', fullPath);
            }
        }
    }
}

console.log('Starting refactor...');
processDirectory(API_DIR);
console.log('Finished refactor.');
