const contactData = require('../models/contactModel');
const messageModel = require('../models/messageModel');
const chatList = async (req, res) => {
  const { phoneNumberId, type } = req.params;

  try {
    const contactsWithLastMessage = await contactData.aggregate([
      {
        $match: {
          phoneNumberId: Number(phoneNumberId),
          type: type
        }
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "contactId",
          as: "messages"
        }
      },
      {
        $addFields: {
          lastMessage: {
            $arrayElemAt: [
              {
                $slice: [
                  {
                    $filter: {
                      input: "$messages",
                      as: "msg",
                      cond: { $ne: ["$$msg.status", "deleted"] }
                    }
                  },
                  -1
                ]
              },
              0
            ]
          }
        }
      },
      {
        $sort: {
          "lastMessage.time": -1
        }
      }
    ]);

    return res.status(200).json(contactsWithLastMessage);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "An error occurred while fetching contacts" });
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
            $match: { contactId: contactId }
          },
          {
            $lookup: {
              from: 'media',
              localField: 'media_id',
              foreignField: 'media_id',
              as: 'media_details'
            }
          },
          {
            $unwind: {
              path: '$media_details',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'messages', // Self-lookup in the same collection
              localField: 'reply_to',
              foreignField: 'message_id', // Matching WhatsApp message_id
              as: 'replied_message'
            }
          },
          {
            $unwind: {
              path: '$replied_message',
              preserveNullAndEmptyArrays: true
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