import app from './app.js';
import connectDB from '@db/connect';
import env from '@config/env';

async function start() {
  try {
    await connectDB();
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('✗ MongoDB connection failed:', message);
  }

  app.listen(env.PORT, () => {
    console.log(`✓ Server running on port ${env.PORT}`);
  });
}

start();
