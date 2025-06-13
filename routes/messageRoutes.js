const express = require('express');
const multer = require('multer');
const path = require('path');
const { sendMessage, verifyWebhook, receiveMessage, uploadMedia } = require('../controllers/messageController');

const router = express.Router();
// Configure storage to preserve file extensions
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Set the upload directory
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName); // Save the file with its original name and a timestamp
    }
  });
  
  const upload = multer({ storage });

// Route to send a message
router.post('/send', sendMessage);

// Route for webhook verification
router.get('/webhook/:phoneNumberId', verifyWebhook);

// Route to receive messages from the webhook
router.post('/webhook/:phoneNumberId', receiveMessage);

// Route to upload media
router.post('/upload',upload.single('file'), uploadMedia);

module.exports = router;
