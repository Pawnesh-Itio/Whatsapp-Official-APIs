const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
    userId:{type: Number, required: true},
    accessToken:{type: String, required: true},
    phoneNumberId:{type: Number, required: true},
    webhookVerificationToken:{type:String, required: true},
    source:{type:String, required: true}
});

module.exports = mongoose.model('Configuration',configurationSchema);
