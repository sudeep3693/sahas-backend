import dotenv from 'dotenv';
import path from 'path';

const projectRoot = path.resolve(process.cwd());
dotenv.config();
dotenv.config({ path: path.join(projectRoot, 'Static.env') });

await import('./index.js');
