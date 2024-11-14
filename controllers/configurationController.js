const configurationModel = require('../models/configurationModel');

const saveConfiguration = async (req, res) =>{
    try {
    const {userId, accessToken, phoneNumberId, webhookUrl, webhookVerificationToken} = req.body;
    //Check if a record of same user exist, then update or insert.
    const updateData = await configurationModel.findOneAndUpdate(
        {userId:userId},//Filter by User Id to indentify exisitng record
        {accessToken:accessToken, phoneNumberId:phoneNumberId,webhookVerificationToken:webhookVerificationToken},// Data to be updated.
        {new: true, upsert: true, useFindAndModify: false} // Upsert: true creates a new document if none exists
    );
    res.status(200).json({ message: 'Data saved/updated successfully!', data: updateData });
} catch (error) {
    res.status(500).json({ message: 'Error saving/updating data', error })
}
}
const getConfigurationDetailByUserId = async (req, res) =>{
    const {userId} = req.params // Get user id from url parameters.
    try{
        const data = await configurationModel.findOne({userId});
        if(data){
            return res.status(200).json(data);
        }else{
            return res.status(400).json({ message: 'Data not found' });
        }
    } catch (error){

    }
}
module.exports = { saveConfiguration,getConfigurationDetailByUserId };