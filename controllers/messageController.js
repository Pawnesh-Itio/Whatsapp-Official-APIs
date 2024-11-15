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
const receiveMessage = async(req, res) => {
  const userId = req.params.userId;  // Access userId from URL params
  const data = req.body;
  // Process incoming message
  if (data.object === 'whatsapp_business_account') {  
    data.entry.forEach((entry) => {
      const changes = entry.changes;
      changes.forEach((change) => {
        if (change.field === 'messages') {
          const message = change.value.messages[0];
          const contacts = change.value.contacts[0];
          console.log('Received message:', message);
          // Initializing form data.
          const formData = {
            name: contacts.profile.name,
            from: message.from,
            id: message.id,
            timestamp: message.timestamp,
            text: message.text.body,
            type: message.type
          };
          console.log('Form Data :', formData);
           // Sending POST request to an external API endpoint
          const response =  axios.post('https://xeyso.com/crm/wa-server', formData);
          // Sending back the response from the external API
          console.log(response);
          // Downtime solution here
          res.json(response.data);
        }
      });
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }

};

module.exports = { sendMessage, verifyWebhook, receiveMessage };
