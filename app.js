// cPanel/LiteSpeed launcher. Configuration is loaded by src/start.js.

import('./src/start.js')
  .then(() => {
    console.log('Backend ES module initialized successfully');
  })
  .catch((err) => {
    console.error('Error starting backend application:', err);
    process.exitCode = 1;
  });
