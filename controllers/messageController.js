const axios = require('axios');
const configurationModel = require('../models/configurationModel');
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
const receiveMessage = (req, res) => {
  const data = req.body;

  if (data.object === 'whatsapp_business_account') {
    data.entry.forEach((entry) => {
      const changes = entry.changes;
      changes.forEach((change) => {
        if (change.field === 'messages') {
          // Send the entire message object to CodeIgniter
          axios.post('http://localhost/perfex_crm/wa-server', message)
            .then(response => {
              console.log('Message sent to CodeIgniter:', response.data);
            })
            .catch(error => {
              console.error('Error sending message to CodeIgniter:', error.message);
            });
          console.log('Received message:', message);
        }
      });
    });

    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
};

module.exports = { sendMessage, verifyWebhook, receiveMessage };
