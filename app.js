// CommonJS launcher for LiteSpeed / cPanel Node runner
// Dynamically imports the ES Module backend inside src/index.js

import('./src/index.js')
  .then(() => {
    console.log('Backend ES module initialized successfully');
  })
  .catch((err) => {
    console.error('Error starting backend application:', err);
  });
