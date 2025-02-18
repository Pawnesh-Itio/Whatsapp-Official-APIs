const express = require('express');
const { chatList, messageList} = require('../controllers/chatController');

const router = express.Router();

// Route to send a message
router.get('/list/:phoneNumberId/:type', chatList);
router.get('/messages/:chatId/:phoneNumberId/:type',messageList);

module.exports = router;
