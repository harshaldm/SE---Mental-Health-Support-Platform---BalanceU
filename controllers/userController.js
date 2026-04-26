const { User, Institute } = require('../models');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * GET /api/user/profile
 * Fetched profile with Institute JOIN
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      include: [{
        model: Institute,
        attributes: ['name']
      }],
      attributes: ['id', 'email', 'full_name', 'role', 'profile_metadata', 'institute_id']
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const institute_name = user.Institute?.name || 'External';

    logger.info(`[userController.js : getProfile : 22] -> Fetched profile for ${userId} with Institute: ${institute_name}.`);

    res.json({
      user: {
        ...user.toJSON(),
        institute_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /api/user/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone_number, avatar_url, institute_data, daily_reminder } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentMeta = user.profile_metadata || {};
    
    const updatedMeta = {
      ...currentMeta,
      phone_number: phone_number !== undefined ? phone_number : currentMeta.phone_number,
      avatar_url: avatar_url !== undefined ? avatar_url : currentMeta.avatar_url,
      daily_reminder: daily_reminder !== undefined ? daily_reminder : currentMeta.daily_reminder,
      institute_data: {
        ...(currentMeta.institute_data || {}),
        ...(institute_data || {})
      }
    };

    await user.update({ profile_metadata: updatedMeta });

    logger.info(`[userController.js : updateProfile : 65] -> Updated profile for ${userId}`);
    res.json({ message: 'Profile updated success', profile: updatedMeta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/user/change-password
 * Changes the user's password verifying the current one.
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    console.log(`[userController.js] -> Processing password change for Admin ID: ${userId}.`);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    user.password_hash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('❌ Error changing password:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
