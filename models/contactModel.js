const mongoose = require('mongoose');
const contactDataSchema = new mongoose.Schema({
      phoneNumberId: {
        type: Number, // Store phoneNumberIds
        required: true
      },
      wa_name: {
                 type: String,
                 maxlength: 50 
               },
      wa_phone_number: {
                 type:String,
                 required: true,
                 maxlength:15
      },
      wa_id: String,
      type: {
        type: String,
        required: true,
        enum: ["Regular","DMs" ], 
      },
      status: {
                type: Number,
                required: true,
                enum: [1, 2], 
    },
  }, { timestamps: true });
  
  module.exports = mongoose.model('contact',contactDataSchema);
  