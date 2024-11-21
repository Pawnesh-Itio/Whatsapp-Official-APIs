const mongoose = require('mongoose');
const leadsDataSchema = new mongoose.Schema({
    object: String,
    entry: [{
      id: String,
      name: String,
      from: String,
      message_id: String,
      timestamps: String,
      type: String,
      message: String

    }]
  }, { timestamps: true });
  
  module.exports = mongoose.model('leadsData',leadsDataSchema);
  