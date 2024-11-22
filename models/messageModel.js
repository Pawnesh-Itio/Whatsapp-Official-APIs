const mongoose = require('mongoose');
const messageDataSchema = new mongoose.Schema({
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'contact', // Reference to the contact model
        required: true
    },
    conversation_id:String,
    message_id: String,
    message_type:{
        type: String,
        required: true,
        enum: ['sent', 'received'],
    },
    message_body:{
        type: String,
        required: true,
    },
    time: {
        type: Number,
        required:true,
    },
    sent_by: Number,
    status:{
        type: String,
        required: true,
        enum: ['sent', 'delivered', 'read', 'failed', 'deleted'],
    }
  }, { timestamps: true });
  
  module.exports = mongoose.model('message',messageDataSchema);
  