const express = require('express');

const {saveConfiguration,getConfigurationDetailBySource,deleteConfiguration, assignConfigurationToUser} =  require('../controllers/configurationController');

const router = express.Router();

// Route to Save configuration details
router.post('/save', saveConfiguration);
router.post('/assign/user',assignConfigurationToUser);
router.post('/fetch/',getConfigurationDetailBySource);
router.delete('/delete/:config_id', deleteConfiguration);
module.exports = router;