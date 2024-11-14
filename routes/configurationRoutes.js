const express = require('express');

const {saveConfiguration,getConfigurationDetailByUserId} =  require('../controllers/configurationController');

const router = express.Router();

// Route to Save configuration details
router.post('/save', saveConfiguration);
router.get('/fetch/:userId',getConfigurationDetailByUserId)

module.exports = router;