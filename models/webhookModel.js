const mongoose = require('mongoose');
const webhookDataSchema = new mongoose.Schema({
    object: String,
    entry: [{
      id: String,
      changes: [{
        field: String,
        value: Object
      }]
    }]
  }, { timestamps: true });
  
  module.exports = mongoose.model('WebhookData',webhookDataSchema);
  