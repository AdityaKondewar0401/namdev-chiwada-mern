// server/controllers/userController.js
//
// Admin-only user directory. Didn't exist before this file — there was no
// route anywhere that let an admin list users or view one user's details
// (confirmed by grepping every route/controller in the app). `protect` +
// `admin` gating happens in routes/users.js, same convention as every
// other admin route in this codebase.

const User = require('../models/User');
const Order = require('../models/Order');

/* =========================================
   ADMIN: LIST USERS
   Every user (password excluded), optionally filtered by role and/or a
   case-insensitive name/email search. Per-user order count + lifetime
   spend + last-order date come from ONE grouped Order.aggregate() call
   (not one query per user) so the list stays cheap regardless of how
   many users or orders exist.
========================================= */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      // Escape regex metacharacters in the raw search string — otherwise
      // a search term like "a.b" would run as "any char" against every
      // name/email instead of a literal match, and an unbalanced `(`/`[`
      // would throw a SyntaxError inside the query itself.
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          lifetimeSpend: { $sum: '$total' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);
    const statsByUser = Object.fromEntries(orderStats.map((s) => [String(s._id), s]));

    const usersWithStats = users.map((u) => {
      const stats = statsByUser[String(u._id)];
      return {
        ...u,
        orderCount: stats?.orderCount || 0,
        lifetimeSpend: stats?.lifetimeSpend || 0,
        lastOrderAt: stats?.lastOrderAt || null,
        wishlistCount: u.wishlist?.length || 0,
      };
    });

    res.json({ success: true, users: usersWithStats, count: usersWithStats.length });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   ADMIN: GET ONE USER
   Full profile (minus password) + wishlist populated to display basics +
   aggregated order stats + the 5 most recent orders, so a single fetch
   gives the admin everything to analyze about this one customer.
========================================= */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('wishlist', 'name img price')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [statsAgg] = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          lifetimeSpend: { $sum: '$total' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);

    const recentOrders = await Order.find({ user: user._id })
      .select('items status total paymentMethod paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      user,
      stats: {
        orderCount: statsAgg?.orderCount || 0,
        lifetimeSpend: statsAgg?.lifetimeSpend || 0,
        lastOrderAt: statsAgg?.lastOrderAt || null,
        wishlistCount: user.wishlist?.length || 0,
      },
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};
