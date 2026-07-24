import Customer from '../models/Customer.js';
import connectDB from '../db/connect.js';
import { success, error, paginated } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/customers/stats
export const getCustomerStats = asyncHandler(async (req, res) => {
  await connectDB();

  const [totalCustomers, activeCustomers, suspendedCustomers, newCustomers30d] =
    await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: 'active' }),
      Customer.countDocuments({ status: 'suspended' }),
      Customer.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

  return res.json(
    success({
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      newCustomers30d,
    })
  );
});

// GET /api/customers
export const getCustomers = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};
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
    Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// POST /api/customers
export const createCustomer = asyncHandler(async (req, res) => {
  await connectDB();

  const { name, email, phone, address } = req.body;

  if (!name || !email) {
    return res.status(400).json(error('Name and email are required'));
  }

  const customer = await Customer.create({ name, email, phone, address });
  return res.status(201).json(success(customer, 'Customer created'));
});

// PUT /api/customers/:id
export const updateCustomer = asyncHandler(async (req, res) => {
  await connectDB();

  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!customer) {
    return res.status(404).json(error('Customer not found'));
  }

  return res.json(success(customer, 'Customer updated'));
});

// DELETE /api/customers/:id
export const deleteCustomer = asyncHandler(async (req, res) => {
  await connectDB();

  const customer = await Customer.findByIdAndDelete(req.params.id);

  if (!customer) {
    return res.status(404).json(error('Customer not found'));
  }

  return res.json(success(null, 'Customer deleted'));
});
