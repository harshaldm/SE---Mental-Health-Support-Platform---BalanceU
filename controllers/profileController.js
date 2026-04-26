const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Update User Profile (Personal & Institute Data)
 * PUT /api/profile/update
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone_number, institute_data } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare metadata update
    const currentMetadata = user.profile_metadata || {};
    
    // Update phone number if provided
    if (phone_number !== undefined) {
      currentMetadata.phone_number = phone_number;
      logger.info(`[profileController.js : updateProfile : 24] -> User ${userId} updated phone_number to ${phone_number}.`);
    }

    // Update institute_data (nested JSONB) if provided
    if (institute_data && typeof institute_data === 'object') {
      currentMetadata.institute_data = {
        ...(currentMetadata.institute_data || {}),
        ...institute_data
      };
      
      Object.keys(institute_data).forEach(field => {
        logger.info(`[profileController.js : updateProfile : 35] -> User ${userId} updated institute_data.${field} to ${institute_data[field]}.`);
      });
    }

    // Save changes
    // Using changed() explicitly because it's a JSONB field
    user.set('profile_metadata', currentMetadata);
    user.changed('profile_metadata', true);
    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      profile_metadata: user.profile_metadata
    });
  } catch (error) {
    logger.error(`[profileController.js : updateProfile : 51] -> Error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
