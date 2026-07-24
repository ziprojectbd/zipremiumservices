import mongoose from 'mongoose';
import User from '../models/User.js';
import { devLog } from './devLogger.js';

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function syncAdminEmail() {
  if (!MONGODB_URI || !ADMIN_EMAIL) {
    devLog('⚠️  MONGODB_URI or ADMIN_EMAIL not set, skipping admin sync');
    return;
  }

  try {
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
    }

    // Remove admin role from all users except the ADMIN_EMAIL
    const result = await User.updateMany(
      { email: { $ne: ADMIN_EMAIL }, role: 'admin' },
      { role: 'customer' }
    );

    if (result.modifiedCount > 0) {
      devLog(`✅ Removed admin role from ${result.modifiedCount} user(s)`);
    }

    // Ensure ADMIN_EMAIL has admin role
    const adminUser = await User.findOne({ email: ADMIN_EMAIL });
    if (adminUser) {
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        devLog(`✅ Added admin role to ${ADMIN_EMAIL}`);
      }
    } else {
      devLog(`⚠️  Admin email ${ADMIN_EMAIL} not found in database`);
    }

    // Show current admin users
    const adminUsers = await User.find({ role: 'admin' });
    devLog(`📊 Current admin users: ${adminUsers.map((u: any) => u.email).join(', ')}`);
  } catch (error: any) {
    devLog('❌ Error syncing admin email:', error.message);
  }
}
