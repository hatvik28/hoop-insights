import { copyFileSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist');
const indexHtml = join(distDir, 'index.html');
const notFoundHtml = join(distDir, '404.html');

try {
  copyFileSync(indexHtml, notFoundHtml);
  console.log('✓ Copied index.html to 404.html');
} catch (error) {
  console.error('Error copying 404.html:', error);
  process.exit(1);
}

