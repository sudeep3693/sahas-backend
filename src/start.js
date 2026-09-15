import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), '..');
dotenv.config({ path: path.join(projectRoot, 'Static.env'), override: true });

await import('./index.js');
