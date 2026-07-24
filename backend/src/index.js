import app from './app.js';
import connectDB from './db/connect.js';
import env from './config/env.js';

async function start() {
  try {
    await connectDB();
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
  }

  app.listen(env.PORT, () => {
    console.log(`✓ Server running on port ${env.PORT}`);
  });
}

start();
