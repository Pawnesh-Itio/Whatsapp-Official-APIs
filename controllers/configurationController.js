const configurationModel = require('../models/configurationModel');

const saveConfiguration = async (req, res) =>{
    try {
    const {accessToken, phoneNumber, phoneNumberId,department,staffId, webhookVerificationToken, source, config_id} = req.body;
    //Check if a record of same user exist, then update or insert.
    const updateValues = {
        accessToken,
        phoneNumber,
        phoneNumberId,
        webhookVerificationToken,
        source
    };
    if(department && department !="0"){
        updateValues.type = "Department";
        updateValues.departmentId=department;
    }
    if(staffId){
        updateValues.type = "Staff";
        updateValues.staffId = staffId;
    }
    if(department=="0" && !staffId){
        updateValues.type = "Selective";
    }
    if(config_id){
        const updateData = await configurationModel.findOneAndUpdate(
            {_id: config_id},//Filter by Config Id
            updateValues,
            {new: true}
        );
        res.status(200).json({ message: 'Phone number updated successfully!', data: updateData });
    }else{
            // Insert new record
            try {
            const newRecord = new configurationModel(updateValues);
            await newRecord.save();
            res.status(200).json({ message: 'Phone number created successfully!', data: newRecord });
        } catch (error) {
            res.status(400).json({ message: 'Error creating phone number!', error: error.message });
        }
    }
} catch (error) {
    res.status(500).json({ message: 'Error saving/updating data', error })
}
}
const getConfigurationDetailBySource = async (req, res) =>{
    const {source} = req.params // Get user id from url parameters.
    try{
        const data = await configurationModel.find({source});
        if(data){
            return res.status(200).json(data);
        }else{
            return res.status(400).json({ message: 'Data not found' });
        }
    } catch (error){

    }
}
const assignConfigurationToUser = async(req, res) =>{
    const { id, newAssignTo} = req.body;
    if(!id){
        return res.status(404).json({message:"Configuration ID is missing!"});
    }
    if(!newAssignTo){
        return res.status(404).json({message:"User ID is missing!"});
    }
    // Ensure newAssignTo is converted to a number
    const valueToAdd = parseInt(newAssignTo, 10);
    if (isNaN(valueToAdd)) {
        return res.status(400).json({ error: 'Invalid value for assignTo' });
    }
    try{
        const updateData = await configurationModel.findByIdAndUpdate(
            id,
            {
                $addToSet:{assignTo:valueToAdd} // Add if `assignTo` exists prevent dublication
            },
            {
                new: true // Return the updated document 
            }
        );
        return res.status(201).json({success:true});
    } catch (err){
        return res.status(500).json({error:"Failed to assign user!"});
    }
}
const deleteConfiguration = async (req, res) => {
    try {
        const { config_id } = req.params; // Get config_id from URL parameters
        // Delete the record
        const deletedData = await configurationModel.findByIdAndDelete(config_id);

        if (!deletedData) {
            return res.status(404).json({ message: 'Configuration not found!' });
        }

        return res.status(200).json({ message: 'Configuration deleted successfully!', data: deletedData });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting configuration', error: error.message });
    }
};

module.exports = { saveConfiguration,getConfigurationDetailBySource,deleteConfiguration, assignConfigurationToUser };