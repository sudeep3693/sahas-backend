// CommonJS wrapper for LiteSpeed / Phusion Passenger in cPanel
// Allows require() from lsnode.js while dynamically importing ES module src/index.js

import('./src/index.js')
  .then(() => {
    console.log('ES Module backend loaded successfully via app.cjs');
  })
  .catch((err) => {
    console.error('Failed to load ES Module backend in app.cjs:', err);
  });
