const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
    source:{type:String, required: true},//Defines the origin of the configuration
    type:{
        type: String,
        required: true,
        enum: ["Department", "Staff", "Selective"]  // Configuration can be made for a department, for a particular staff or for selective members
    },
    departmentId:{type:Number, required:false},// In case of Department configuration this will be set
    staffId:{type:Number, required:false},//In case of Staff configuration this will be set
    assignTo:{ type: [Number], required: false }, // In case of Selective configuration this will be set
    accessToken:{type: String, required: true}, // accessToken from meta 
    phoneNumberId:{type: Number, required: true},// phonenumber Id from meta
    phoneNumber:{type:Number, required:true},// phoneNumber from meta
    webhookVerificationToken:{type:String, required: true},//webhookVerification from meta
    companyId:{type:Number, required:false},//companyId from meta
});

module.exports = mongoose.model('Configuration',configurationSchema);
