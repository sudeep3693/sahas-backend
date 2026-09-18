import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveDocumentUrl, buildPdfFilename } from '../src/utils/documentUrl.js';

test('resolves local backend pdf paths', () => {
  assert.equal(
    resolveDocumentUrl('https://sahas-backend.onrender.com', '/pdf/reports/report.pdf'),
    'https://sahas-backend.onrender.com/pdf/reports/report.pdf'
  );
});

test('converts Cloudinary image URLs into raw PDF URLs', () => {
  const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v123/report.pdf';
  assert.equal(
    resolveDocumentUrl('https://sahas-backend.onrender.com', cloudinaryUrl),
    'https://res.cloudinary.com/demo/raw/upload/v123/report.pdf'
  );
});

test('preserves uploaded PDF filename while sanitizing unsafe characters', () => {
  assert.equal(buildPdfFilename('abv.pdf'), 'abv.pdf');
  assert.equal(buildPdfFilename('Quarterly Report.pdf'), 'Quarterly_Report.pdf');
  assert.equal(buildPdfFilename('  Annual Report .pdf  '), 'Annual_Report.pdf');
});
