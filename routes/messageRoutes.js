const express = require('express');
const { sendMessage, verifyWebhook, receiveMessage } = require('../controllers/messageController');

const router = express.Router();

// Route to send a message
router.post('/send', sendMessage);

// Route for webhook verification
router.get('/webhook/:userId', verifyWebhook);

// Route to receive messages from the webhook
router.post('/webhook/:userId', receiveMessage);

module.exports = router;
