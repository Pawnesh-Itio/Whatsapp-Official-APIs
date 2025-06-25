const contactData = require('../models/contactModel');
const messageModel = require('../models/messageModel');
const chatList = async (req, res) => {
  const { phoneNumberId, type } = req.params;

  try {
    console.log("Fetching chat list for phoneNumberId:", phoneNumberId, "and type:", type);
    const contacts = await contactData.find({ phoneNumberId, type });
    console.log("Matching Contacts:", contacts);
    const contactsWithLastMessage = await contactData.aggregate([
      {
        $match: {
          phoneNumberId: phoneNumberId,
          type: type
        }
      },
      {
        $lookup: {
          from: "messages",// Name of the collection
          localField: "_id",// Field in the contact collection
          foreignField: "contactId",// Field in the messages collection
          as: "messages"// Alias for the messages array
        }
      },
      {
        $addFields: {
          lastMessageTime: { $max: "$messages.time" }
        }
      },
      {
        $sort: {
          lastMessageTime: -1
        }
      },
      {
        $project: {
          messages: 0, // don’t return full messages array
        }
      }
    ]);
    console.log("Contacts with last message:", contactsWithLastMessage);

    res.status(200).json(contactsWithLastMessage);
  } catch (error) {
    console.error("Error fetching chat list:", error);
    res.status(500).json({ error: "An error occurred while fetching chat list." });
  }
};

const messageList = async (req, res) => {
    const { chatId, phoneNumberId, type } = req.params;
  
    try {
      // fetch contact using chatId and phonenumberId there could be same number for two or more different phonenumbers
      const findContactData = await contactData.findOne({ wa_phone_number: chatId,phoneNumberId:phoneNumberId,type: type });
  
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