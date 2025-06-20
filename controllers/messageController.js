const axios = require('axios');
const configurationModel = require('../models/configurationModel');
const contactData = require('../models/contactModel');
const messageModel = require('../models/messageModel');
const mediaModel = require('../models/mediaModel');
const { getMediaUrl, downloadMedia } = require("../utils/mediautils");
const { json } = require('body-parser');
const fs = require('fs');
const FormData = require('form-data');
// Controller to send WhatsApp messages
const sendMessage = async (req, res) => {
    const {userId, phoneNumberId, accessToken, source, configurationId, ContactType, contactName, messageType, to, message, tempName,  caption, mediaId, mediaCategory} = req.body; // Required fields to send the message

    //Condition to check recipient number 
    if (!to){
      return res.status(400).json({ error: 'Recipient number is required' });
    }

    // Condition for credentials
    let credentials = { phoneNumberId, accessToken };
    if (!phoneNumberId || !accessToken) {
        if (!source || !configurationId) {
          return res.status(400).json({ error: 'Either phoneNumberId and accessToken or Source and Configuration Id must be provided' });
      }
      // Fetch access Token
        credentials = await configurationModel.findOne({ source:source, _id:configurationId });
        if (!credentials) {
          return res.status(404).json({ error: `No credentials found for source: ${source}` });
        }
    }
    // End conditions for credentials

    // Plain Message Details Start
    if(messageType ==1){ 
      if (!message) {
        return res.status(400).json({ error: 'Message content is required' });
      }
    const PlainMessagePayload = 
    {
      messaging_product:'whatsapp',
      recipient_type:'individual',
      to:to,
      type:'text',
      text:{
          preview_url:false,
          body:message
      }
    }
    var sendPaylod = PlainMessagePayload;
    }
    // Plain Message Details Ended

    // Message with link Started
    if(messageType==2){ 
      const messageWithLink = 
      {
        messaging_product:'whatsapp',
        to:to,
        text:{
            preview_url: true,
            body:message
        }
      }
      var sendPaylod = messageWithLink;
    }
    // Message with link Ended

    // Template Message Details Started
    if(messageType==3){ 
      if (!tempName) {
        return res.status(400).json({ error: 'Template name is required' });
      }
      const TemplateMessagePayload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: tempName,
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'image',
                  image: {
                    link: 'https://wa-business-api.onrender.com/uploads/pcl_hello.png' // Use actual HTTPS public link
                  }
                }
              ]
            }
          ]
        }
      };

      var sendPaylod = TemplateMessagePayload;
    }

    // Template Message Details Ended

    // Media message with caption or without started
    if (messageType == 4) {

      if (!mediaId || !mediaCategory) {
        return res.status(400).json({ error: 'mediaId and mediaCategory are required for media messages' });
      }

      // Build media-specific payload
      let mediaPayload = { id: mediaId };
      if (caption && (mediaCategory === 'image' || mediaCategory === 'video' || mediaCategory === 'document')) {
        mediaPayload.caption = caption;
      }

      const MediaMessagePayload = {
        messaging_product: 'whatsapp',
        to: to,
        type: mediaCategory,
        [mediaCategory]: mediaPayload
      };

      var sendPaylod = MediaMessagePayload;
    }
    // Media message with caption or without Ended
    
  
    // WA-Official api hit with appropriate payload
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v14.0/${credentials.phoneNumberId}/messages`,
        sendPaylod,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Check if contact exist if not exist create new contact.
      let contactId;
      const findContactData = await contactData.findOne({ wa_phone_number: to, phoneNumberId:credentials.phoneNumberId });
      if(findContactData){
        contactId = findContactData._id;
      }else{
        const contactToInsert = {
          phoneNumberId:credentials.phoneNumberId,
          wa_phone_number: to,
          wa_id: to,
          type:ContactType,
          status: 1,
        };
        // Add wa_name if exist
        if(contactName){
          contactToInsert.wa_name = contactName
        }
        const newContact = new contactData(contactToInsert);
        await newContact.save();
        contactId = newContact._id;
      }
      // Contact creation ended

      // Message Creation Started
      const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
      if(messageType ==1){
        var insertMessageBody = message;
      }
      if(messageType==2){
        var insertMessageBody = message;
      }
      if(messageType==3){
        var insertMessageBody = tempName;
      }
      if(messageType==4){
        var insertMessageBody =caption;
      }
      const messageToInsert = {
        message_id: response.data.messages[0].id,
        contactId:contactId,
        message_type: 'sent',
        message_content:messageType,
        message_body: insertMessageBody,
        time:timestamp,
        status: 'sent',
        sent_by: userId
      }
      if(messageType==4){
        messageToInsert.media_id = mediaId;
        messageToInsert.media_type = mediaCategory;
      }
      const newMessage = new messageModel(messageToInsert);
      await newMessage.save();
      // Message Creation Ended

      // Return response
      return res.status(200).json({ success: true, data: response.data, type: messageType});

    } catch (error) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
      res.status(400).json({ success: false, error: error });
    }
  };

const uploadMedia = async(req, res) =>{
  const {userId, phoneNumberId, accessToken, source,configurationId } = req.body;
  const {path: filePath, mimetype} = req.file

  let credentials = { phoneNumberId, accessToken };
  if (!phoneNumberId || !accessToken) {
      if (!source || !configurationId) {
        return res.status(400).json({ error: 'Either phoneNumberId and accessToken or Source and ConfigurationId must be provided' });
    }
    // Fetch access Token
    if(source=='crm'){
      credentials = await configurationModel.findOne({ source:source, _id:configurationId });
      if (!credentials) {
        return res.status(404).json({ error: `No credentials found for source: ${source}` });
      }
    }
  }
  try{
      // Create form-data for uploading the file
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp'); // Specify the messaging product
      formData.append('file', fs.createReadStream(filePath),{contentType:mimetype});//Specify the image path
      formData.append('type', mimetype); // Specify the type of image
      const response = await axios.post(
          `https://graph.facebook.com/v14.0/${credentials.phoneNumberId}/media`,
          formData,
          {
              headers: {
                  Authorization: `Bearer ${credentials.accessToken}`
              },
          }
      );
      const dataToInsert = {
        path:filePath,
        mime_type:mimetype,
        media_id:response.data.id,
        user_id:userId,
        status:1
      }
      try{
      const newMedia = new mediaModel(dataToInsert);
      await newMedia.save();
      }catch (err){
        console.log(err);
      }
     return res.status(200).json({ media_id: response.data.id, path: filePath });
     
  }catch (err){
    console.log(err);
    return res.status(400).json({ message: "Failed to upload", status:"failed"});
  }
}
// Controller to handle webhook verification (GET)
const verifyWebhook = async (req, res) => {
const {phoneNumberId} = req.params // Get user id from url parameters.
const data = await configurationModel.findOne({ phoneNumberId: Number(phoneNumberId) });
  if(data){
      console.log(`Data found: ${data}`);
      const verificationToken = data.webhookVerificationToken;
      // MetaVerification
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode && token === verificationToken) {
        console.log('WEBHOOK_VERIFIED');
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
  const processedStatuses = new Set();
  const data = req.body;

  // Validate incoming data
  if (data.object !== "whatsapp_business_account") {
    return res.sendStatus(400); // Invalid data format
  }

  try {
    for (const entry of data.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages" && change.value.messages) {
          console.log(change);
          const metadata = change.value.metadata;
          console.log(metadata);
          const message = change.value.messages[0];
          const contacts = change.value.contacts[0];
          const phoneNumberId = metadata.phone_number_id;
          // Add phonenumberid  to create contact
          console.log(`Display Phone number: ${metadata.display_phone_number} Phone Number ID: ${metadata.phone_number_id}`);
          const contactToInsert = {
            phoneNumberId: metadata.phone_number_id,
            wa_name: contacts.profile.name,
            wa_phone_number: message.from,
            wa_id: contacts.wa_id,
            status: 1,
            type:"Regular"
          };

          const messageToInsert = {
            message_id: message.id,
            message_type: "received",
            time: message.timestamp,
            status: "sent"
          };
          // User PhoneNumberID as well to fetch contactData
          const findContactData = await contactData.findOne({ wa_phone_number: contactToInsert.wa_phone_number,phoneNumberId: metadata.phone_number_id });

          if (findContactData) {
            // Add message for existing contact
            messageToInsert.contactId = findContactData._id;
            let messageContentToInsert = {};
            let mediaPath = "";
            switch (message.type) {
              case "text":
                messageContentToInsert = {
                  ...messageToInsert,
                  message_content: 1,
                  message_body: message.text.body,
                };
                console.log("Text message received Case 1:", message.text.body);
                break;
              case "image":
              case "video":
              case "document":
              case "audio":
                const mediaId = message[message.type].id; // Assuming media ID is used to fetch
                const mediaUrl = await getMediaUrl(mediaId, phoneNumberId);
                const savedPath = await downloadMedia(mediaUrl.url, mediaUrl.mime_type, mediaId, phoneNumberId);
                console.log("Media downloaded to Case 4:", savedPath);
                //Save media record
                const mediaRecord = new mediaModel({
                  path: savedPath,
                  mime_type: mediaUrl.mime_type,
                  media_id: mediaId,
                  media_url: mediaUrl.url,
                  status: 1,
                });
                await mediaRecord.save();
                messageContentToInsert = {
                  ...messageToInsert,
                  message_content: 4,
                  message_body: message[message.type].caption || "",
                  media_id: mediaId,
                  media_type: message.type,
                };
                break;
                default:
                  console.log("Unsupported message type:", message.type);
                  continue; // Skip unsupported message types
            }

            const newMessage = new messageModel(messageContentToInsert);
            await newMessage.save();

            const io = req.app.get("io");
            io.emit("chat-" + message.from, { messageContentToInsert, type: "received" });
          } else {
            // Create new contact and add message
            const newContact = new contactData(contactToInsert);
            await newContact.save();

            messageToInsert.contactId = newContact._id;
            const newMessage = new messageModel(messageToInsert);
            await newMessage.save();

            // Sending POST request to external API
            try {
              const formData = new FormData();
              formData.append("name", contacts.profile.name);
              formData.append("from", message.from);
              formData.append("id", message.id);
              formData.append("timestamp", message.timestamp);
              formData.append("text", message.text.body);
              formData.append("type", message.type);

              await axios.post("https://paycly.com/my/wa-server", formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            } catch (err) {
              console.error("Error sending data to external API:", err);
            }
          }
        } else if (change.field === "statuses") {
          // Handle message status updates
          const statusData = change.value.statuses[0];
          const messageId = statusData.id;
          const statusKey = `${messageId}-${statusData.status}`;

          if (!processedStatuses.has(statusKey)) {
            processedStatuses.add(statusKey);

            const io = req.app.get("io");
            io.emit("chat-" + statusData.recipient_id, {
              messageId,
              status: statusData.status,
              type: "status",
            });

            // Update message status in the database
            const findMessageData = await messageModel.findOne({ message_id: messageId });
            if (findMessageData && findMessageData.status !== statusData.status) {
              await messageModel.updateOne(
                { message_id: messageId },
                { $set: { status: statusData.status, conversation_id: statusData.conversation?.id || null } }
              );
            }

            setTimeout(() => processedStatuses.delete(statusKey), 60000); // Cleanup
          } else {
            console.log("Duplicate status update ignored:", statusKey);
          }
        }
      }
    }

    res.sendStatus(200); // Acknowledge successful processing
  } catch (error) {
    console.error("Error processing the message:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { sendMessage, verifyWebhook, receiveMessage, uploadMedia };
