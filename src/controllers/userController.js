const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get current user's profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update username
exports.updateUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    // putting all logic in one query to avoid race conditions

    const user = await User.findOneAndUpdate(
      { _id: req.userId, username: { $ne: username } },
      { username },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      // Check if user exists first
      const currentUser = await User.findById(req.userId);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      // If user exists but update failed, username must equal current username
      if (currentUser.username === username) {
        // Username unchanged, return current user
        return res.json({ ...currentUser.toObject(), password: undefined });
      }
      // Otherwise, check if username taken by another user
      const exists = await User.findOne({ username });
      if (exists) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      // Shouldn't reach here, but handle gracefully
      return res.status(500).json({ error: 'Update failed' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update password
exports.updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Old and new password required' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Old password incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};
