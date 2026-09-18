import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveDocumentUrl } from '../src/utils/documentUrl.js';

test('resolves local backend pdf paths', () => {
  assert.equal(
    resolveDocumentUrl('https://sahas-backend.onrender.com', '/pdf/reports/report.pdf'),
    'https://sahas-backend.onrender.com/pdf/reports/report.pdf'
  );
});

test('keeps direct Cloudinary URLs unchanged', () => {
  const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v123/report.pdf';
  assert.equal(resolveDocumentUrl('https://sahas-backend.onrender.com', cloudinaryUrl), cloudinaryUrl);
});
