const contactData = require('../models/contactModel');
const messageModel = require('../models/messageModel');
const chatList = async (req, res) =>{
    try {
        const contacts = await contactData.find({}); 
        res.status(200).json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'An error occurred while fetching contacts' });
    }
}
const messageList = async (req, res) =>{
    const {chatId} = req.params
    try{
    const findContactData = await contactData.findOne({ wa_phone_number: chatId});
    const contactId = findContactData._id;
    const messages = await messageModel.find({contactId: contactId}); 
    return res.status(200).json({messages: messages, status: "success", contaact: findContactData});
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'An error occurred while fetching contacts' });
    }
}
module.exports = { chatList, messageList };