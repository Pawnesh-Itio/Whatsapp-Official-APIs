const contactData = require('../models/contactModel');
const messageModel = require('../models/messageModel');
const chatList = async (req, res) =>{ 
  const { phoneNumberId, type } = req.params;
    try {
      // Fetch contact data using phoneNumberId
        const contacts = await contactData.find({
          phoneNumberId:phoneNumberId,
          type:type
        }); 
        if(contacts){
        return res.status(200).json(contacts);
        }else{
          return res.status(401).json({ error: 'Contact not found' });
        }
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'An error occurred while fetching contacts' });
    }
}
const messageList = async (req, res) => {
    const { chatId, phoneNumberId } = req.params;
  
    try {
      // fetch contact using chatId and phonenumberId there could be same number for two or more different phonenumbers
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