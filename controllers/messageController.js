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
          // if (change.field === 'messages') {
          //   const message = change.value.messages[0];
          //   const contacts = change.value.contacts[0];
          //   console.log('Received message:', message);

          //   // Initialize form data
          //       const formData = new FormData();
          //       formData.append('name', contacts.profile.name);
          //       formData.append('from', message.from);
          //       formData.append('id', message.id);
          //       formData.append('timestamp', message.timestamp);
          //       formData.append('text', message.text.body);
          //       formData.append('type', message.type);

          //   // Initializing mongoss data
          //       const documentToInsert = {
          //         name: contacts.profile.name,
          //         from: message.from,
          //         message_id: message.id,
          //         timestamp: message.timestamp,
          //         type:message.type,
          //         message:message.text.body
          //       };
          //       try{
          //         const leadData = await WebhookData.findOne({ from: documentToInsert.from });
          //         if(leadData){
          //           console.log("Lead Exist: Add socket logic here...");
          //           const io = req.app.get('io');  // Get the Socket.io instance
          //           io.emit('newMessageNotification', { documentToInsert, message: 'Lead exists, update or notify.' });

          //         }else{
          //           console.log("Lead Not Exist: Add Insertion logic here");
          //           const newLead = new WebhookData(documentToInsert);
          //           await newLead.save();
          //            // Log the form data.
          //            console.log('Form Data :', formData);
          //            // Sending POST request to an external API endpoint with form-data
          //            const response = await axios.post('https://xeyso.com/crm/wa-server', formData, {
          //             headers: {
          //               'Content-Type': 'multipart/form-data' // Ensure the request is sent as form-data
          //               }
          //             });
          //             const { message, status } = response.data;
          //             // Log the response from the external API
          //             console.log('Response from external API:',` Message: ${message} Status: ${status}`);
          //             // Revert to the person with automated message.
                      
          //             // Send the response back to the client
          //             return res.json(response.data); // Send response and stop further processing
          //         }
          //       } catch (err) {
          //         console.error('Error:', err);
          //         res.status(500).send('Server error');
          //       }
          // }
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
