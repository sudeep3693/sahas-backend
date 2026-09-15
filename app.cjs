// cPanel/LiteSpeed fallback launcher. Configuration is loaded by src/start.js.

import('./src/start.js')
  .then(() => {
    console.log('Backend loaded successfully via app.cjs');
  })
  .catch((err) => {
    console.error('Failed to load backend in app.cjs:', err);
    process.exitCode = 1;
  });
