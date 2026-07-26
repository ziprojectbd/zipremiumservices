import User from '@models/User';
import connectDB from '@db/connect';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import env from '@config/env';

// GET /api/users/stats
export const getUserStats = asyncHandler(async (req, res) => {
  await connectDB();

  const [totalUsers, activeUsers, suspendedUsers, adminUsers, traders, newUsers30d] =
    await Promise.all([
      User.countDocuments({ role: { $in: ['user', 'customer'] } }),
      User.countDocuments({ role: { $in: ['user', 'customer'] }, status: 'active' }),
      User.countDocuments({ role: { $in: ['user', 'customer'] }, status: 'suspended' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isTrader: true }),
      User.countDocuments({
        role: { $in: ['user', 'customer'] },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

  return res.json(
    success({
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      traders,
      newUsers30d,
    })
  );
});

// GET /api/users
export const getUsers = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { role: { $in: ['user', 'customer'] } };

  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// GET /api/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  await connectDB();

  const user = await User.findById(req.params.id).lean();

  if (!user) {
    return res.status(404).json(error('User not found'));
  }

  return res.json(success(user));
});

// PUT /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  await connectDB();

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json(error('User not found'));
  }

  return res.json(success(user, 'User updated'));
});

// DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  await connectDB();

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json(error('User not found'));
  }

  return res.json(success(null, 'User deleted'));
});

// POST /api/users/assign-admin
export const assignAdmin = asyncHandler(async (req, res) => {
  await connectDB();

  const { email } = req.body;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  if (email !== env.ADMIN_EMAIL) {
    return res.status(403).json(error('Not authorized to assign admin role'));
  }

  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    return res.status(404).json(error('User not found'));
  }

  return res.json(success({ role: user.role }, 'Admin role assigned'));
});
