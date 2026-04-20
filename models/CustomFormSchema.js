const mongoose = require('mongoose');

const customFormSchemaSchema = new mongoose.Schema({
  institute_id: {
    type: String,
    required: true,
    index: true,
  },
  fields: {
    type: mongoose.Schema.Types.Mixed, // Flexible JSON object for institute-specific registration fields
    required: true,
  },
}, {
  timestamps: true,
  collection: 'custom_form_schemas',
});

const CustomFormSchema = mongoose.model('CustomFormSchema', customFormSchemaSchema);

module.exports = CustomFormSchema;
