require('dotenv').config();
const app = require('./app');
const { initializeDatabase, initializeTables } = require('./dbInit');

const PORT = process.env.PORT || 4000;

// Initialize database and tables on server startup
async function startServer() {
  try {
    console.log('Initializing database...');
    const dbInitResult = await initializeDatabase();
    
    if (dbInitResult.success) {
      console.log(`✓ ${dbInitResult.message}`);
    } else {
      console.error(`✗ ${dbInitResult.message}`);
      // Continue anyway - the database might be managed externally
    }

    console.log('Initializing tables...');
    const tablesResult = await initializeTables();
    
    if (tablesResult.success) {
      console.log(`✓ ${tablesResult.message}`);
    } else {
      console.error(`✗ ${tablesResult.message}`);
      // Continue anyway - tables might be managed externally
    }

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // Handle server errors (e.g., port already in use)
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`✗ Port ${PORT} is already in use. Please free the port or use a different port.`);
      } else {
        console.error('✗ Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

