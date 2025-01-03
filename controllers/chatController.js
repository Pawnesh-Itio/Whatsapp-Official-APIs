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
const messageList = async (req, res) => {
    const { chatId } = req.params;
  
    try {
      const findContactData = await contactData.findOne({ wa_phone_number: chatId });
  
      if (findContactData) {
        const contactId = findContactData._id;
  
        const messages = await messageModel.aggregate([
          {
            $match: { contactId: contactId } // Match messages for the contact
          },
          {
            $lookup: {
              from: 'media', // Name of the media collection
              localField: 'media_id', // Field in the message collection
              foreignField: 'media_id', // Field in the media collection
              as: 'media_details' // Alias for the media details array
            }
          },
          {
            $unwind: {
              path: '$media_details', // Unwind the media details array to get a single object
              preserveNullAndEmptyArrays: true // Preserve messages without media details
            }
          }
        ]);
  
        if (messages.length > 0) {
          return res.status(200).json({
            messages: messages,
            status: "success",
            contact: findContactData
          });
        } else {
          return res.status(200).json({
            status: "no_messages",
            contact: findContactData
          });
        }
      } else {
        return res.status(200).json({ status: "no_contact" });
      }
    } catch (error) {
      console.error('Error fetching messages with media:', error);
      res.status(500).json({ error: 'An error occurred while fetching messages' });
    }
  };
  
module.exports = { chatList, messageList };