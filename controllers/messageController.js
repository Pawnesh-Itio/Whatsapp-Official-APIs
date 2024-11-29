const axios = require('axios');
const configurationModel = require('../models/configurationModel');
const contactData = require('../models/contactModel');
const messageModel = require('../models/messageModel');
// Controller to send WhatsApp messages
const sendMessage = async (req, res) => {
    const {userId, phoneNumberId, type, to, message, tempName, source} = req.body; // Required fields to send the message

    // Fetch access Token
    if(source=='crm'){
      const findContactData = await configurationModel.findOne({ userId: 1, source:source });
      const accessToken = findContactData.accessToken;
    }

    // Plain Message Details
    const PlainMessagePayload = {
        messaging_product:'whatsapp',
        recipient_type:'individual',
        to:to,
        type:'text',
        text:{
            preview_url:false,
            body:message
        }
    }
    // Message with link
     const messageWithLink = {
        messaging_product:'whatsapp',
        to:to,
        text:{
            preview_url: true,
            body:message
        }
     }
  
    // Template Message Details
    const TemplateMessagePayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: tempName, // Template name
        language: {
          code: 'en_US', // Language code
        },
      },
    };
    if(type ==1){
      var sendPaylod = PlainMessagePayload;
    }
    if(type==2){
      var sendPaylod = messageWithLink;
    }
    if(type==3){
      var sendPaylod = TemplateMessagePayload;
    }
  
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v14.0/${phoneNumberId}/messages`,
        sendPaylod,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // Check if contact exist if not exist create new contact.
      let contactId;
      const findContactData = await contactData.findOne({ wa_phone_number: to });
      console.log(`findContactData:  ${findContactData}`);
      if(findContactData){
        contactId = findContactData._id;
      }else{
        const contactToInsert = {
          wa_phone_number: to,
          wa_id: to,
          status: 1,
        };
        const newContact = new contactData(contactToInsert);
        await newContact.save();
        contactId = newContact._id;
      }
      const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
      if(type ==1){
        var insertMessageBody = message;
      }
      if(type==2){
        var insertMessageBody = message;
      }
      if(type==3){
        var insertMessageBody = tempName;
      }
      const messageToInsert = {
        message_id: response.data.messages.id,
        contactId:contactId,
        message_type: 'sent',
        message_body: insertMessageBody,
        time:timestamp,
        status: 'sent',
        sent_by: userId
      }
      const newMessage = new messageModel(messageToInsert);
      await newMessage.save();
      res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
      res.status(400).json({ success: false, error: error.message });
    }
  };
  

// Controller to handle webhook verification (GET)
const verifyWebhook = async (req, res) => {
  const {userId} = req.params // Get user id from url parameters.
  const data = await configurationModel.findOne({userId});
  if(data){
      const verificationToken = data.webhookVerificationToken;
      // MetaVerification
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode && token === verificationToken) {
        res.status(200).send(challenge);
      } else {
        res.status(400).send('Forbidden');
      }
  }else{
      return res.status(400).json({ message: 'Data not found' });
  }
};

// Controller to handle incoming WhatsApp messages (POST)
const receiveMessage = async (req, res) => {
  const userId = req.params.userId;  // Access userId from URL params
  const data = req.body;
  // Process incoming message
  if (data.object === 'whatsapp_business_account') {  
    try {
      // Iterate over each entry
      for (const entry of data.entry) {
        const changes = entry.changes;
        // Iterate over each change
        for (const change of changes) {
          if (change.field === 'messages') {
            // Start Receiving Message
            if(change.value.messages){
                  const message = change.value.messages[0];
                  const contacts = change.value.contacts[0];
                  // Initialize form data
                  const formData = new FormData();
                  formData.append('name', contacts.profile.name);
                  formData.append('from', message.from);
                  formData.append('id', message.id);
                  formData.append('timestamp', message.timestamp);
                  formData.append('text', message.text.body);
                  formData.append('type', message.type);

                  // Initializing mongoss data
                  const contactToInsert = {
                    wa_name: contacts.profile.name,
                    wa_phone_number: message.from,
                    wa_id: contacts.wa_id,
                    status: 1,
                  };
                  const messageToInsert = {
                    message_id: message.id,
                    message_type: 'received',
                    message_body: message.text.body,
                    time:message.timestamp,
                    status: 'sent'
                  }
                try{
                  const findContactData = await contactData.findOne({ wa_phone_number: contactToInsert.wa_phone_number });
                  console.log(`findContactData:  ${findContactData}`);
                  if(findContactData){
                    // Insert new messaged
                    messageToInsert.contactId = findContactData._id;
                    const newMessage = new messageModel(messageToInsert);
                    await newMessage.save();
                    const io = req.app.get('io');  // Get the Socket.io instance
                    io.emit('chat-'+message.from, { messageToInsert, type: 'received' });
                  }else{
                    const newContact = new contactData(contactToInsert);
                    await newContact.save();
                    // Insert new messaged
                    messageToInsert.contactId = newContact._id;
                    const newMessage = new messageModel(messageToInsert);
                    await newMessage.save();
                    // Sending POST request to an external API endpoint with form-data
                    try{
                     const response = await axios.post('https://xeyso.com/crm/wa-server', formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data' // Ensure the request is sent as form-data
                        }
                      });
                      const { message, status } = response.data;
                    }catch (err){
                      console.log(err);
                    }
                      // Log the response from the external API
                      console.log('Response from external API:',` Message: ${message} Status: ${status}`);
                      // Revert to the person with automated message.
                      // Send the response back to the client
                      return res.json(response.data); // Send response and stop further processing
                  }
                } catch (err) {
                  console.error('Error:', err);
                  res.status(500).send('Server error');
                }
              } 
              // End Recevied Message
              else if (change.statuses) {
                const statusData = change.statuses;
                const messageId = statusData.id;
                const conversation_id = statusData.conversation.id;
                const recipient_id = statusData.recipient_id;
                const dataToEmit = {
                  messageId: messageId,
                  status: statusData.status
                }
                // Emit socket 
                io.emit('chat-'+recipient_id, { dataToEmit, type: 'status' });
                const updateMessageStatus = {
                  status: statusData.status,
                  conversation_id: conversation_id
                }
                const findMessageData = await messageModel.findOne({ message_id: contactToInsert.from });
                    if(findMessageData){
                      try{
                      const result = await messageModel.updateOne(
                        { message_id: messageId }, // Filter: find the document with the specified conversation_id
                        {
                          $set: updateMessageStatus
                        }
                      );              
                    } catch (err){
                      console.log(`Error: ${err}`);
                    }
                  }
                  return res.json(response.data); // Send response and stop further processing
              }
            }
          }
        }
      // If no valid message data is processed, send a 200 status
      return res.sendStatus(200); 
    } catch (error) {
      console.error('Error processing the message:', error);
      return res.status(500).send('Internal Server Error'); // Handle errors gracefully
    }
  } else {
    return res.sendStatus(400); // Invalid data format, send a 400 status
  }
};
module.exports = { sendMessage, verifyWebhook, receiveMessage };
