const mongoose = require('mongoose');
const mediaSchema = new mongoose.Schema({
      path: {
                 type: String,
                 required:true 
               },
      mime_type: {
                 type:String,
                 required: true,
      },
      media_id:{
        type:Number,
        required:true
      },
      user_id:{
        type:Number,
        required:true
      },
      status: {
                type: Number,
                required: true,
                enum: [1, 2], 
    },
  }, { timestamps: true });
  
  module.exports = mongoose.model('media',mediaSchema);
  