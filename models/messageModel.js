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
    message_content:{
        type: String,
        required: true,
        enum: [1, 2, 3, 4],//1:plain text, 2:Link Message, 3:Template Message,  4:Media Message
    },
    message_body:{
        type: String,
    },
    media_id:{
        type:Number
    },
    media_type:{
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'sticker'],
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
        default: 'sent',
    },
    reply_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }

  }, { timestamps: true });
  
  module.exports = mongoose.model('message',messageDataSchema);
  