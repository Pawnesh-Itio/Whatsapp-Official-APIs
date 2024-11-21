const axios = require('axios');
const configurationModel = require('../models/configurationModel');
const WebhookData = require('../models/webhookModel');
// Controller to send WhatsApp messages
const sendMessage = async (req, res) => {
    const {userId, accessToken, phoneNumberId, type, to, message, tempName} = req.body; // Required fields to send the message

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
      res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
      res.status(500).json({ success: false, error: error.message });
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
  console.log(data);
  // Process incoming message
  if (data.object === 'whatsapp_business_account') {  
    try {
      // Iterate over each entry
      for (const entry of data.entry) {
        const changes = entry.changes;
        // Iterate over each change
        console.log(changes);
        for (const change of changes) {
          console.log(changes);
          
          if (change.field === 'messages') {
           // Check if messages and contacts arrays exist and have at least one element
          const message = change.value.messages && change.value.messages[0];
          const contacts = change.value.contacts && change.value.contacts[0];
            console.log('Received message:', message);
  
            // Initialize form data for sending message
            const formData = new FormData();
            formData.append('name', contacts.profile.name);
            formData.append('from', message.from);
            formData.append('id', message.id);
            formData.append('timestamp', message.timestamp);
            formData.append('text', message.text.body);
            formData.append('type', message.type);
  
            // Initializing mongoose data
            const documentToInsert = {
              name: contacts.profile.name,
              from: message.from,
              message_id: message.id,
              timestamp: message.timestamp,
              type: message.type,
              message: message.text.body
            };
  
            // Handle incoming messages (received messages)
            if (message.status === 'received') {
              try {
                // Check if the lead already exists in the database
                const leadData = await WebhookData.findOne({ from: documentToInsert.from });
                if (leadData) {
                  console.log("Lead exists: Just show new message.");
                  // Emit the message notification for an existing lead
                  const io = req.app.get('io');  // Get the Socket.io instance
                  io.emit('newMessageNotification', { documentToInsert, message: 'New message from existing lead.' });
                } else {
                  console.log("Lead does not exist: Create new lead and show message.");
                  // Insert new lead if it doesn't exist
                  const newLead = new WebhookData(documentToInsert);
                  await newLead.save();
                  
                  // Emit the message notification for a new lead
                  const io = req.app.get('io');
                  io.emit('newMessageNotification', { documentToInsert, message: 'New message from a new lead.' });
                }
              } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Server error');
              }
            }
  
            // Handle sent messages (outgoing messages)
            if (message.status === 'sent' || message.status === 'delivered') {
              console.log("Message sent, no lead insertion.");
              const io = req.app.get('io');  // Get the Socket.io instance
              io.emit('outgoingMessageNotification', { message: 'Message sent, no lead insertion.' });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error processing the webhook data:', err);
      res.status(500).send('Error processing webhook data');
    }
  }
  else {
    return res.sendStatus(400); // Invalid data format, send a 400 status
  }
};
module.exports = { sendMessage, verifyWebhook, receiveMessage };
