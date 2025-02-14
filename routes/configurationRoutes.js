const express = require('express');

const {saveConfiguration,getConfigurationDetailBySource,deleteConfiguration} =  require('../controllers/configurationController');

const router = express.Router();

// Route to Save configuration details
router.post('/save', saveConfiguration);
router.get('/fetch/:source',getConfigurationDetailBySource)
router.delete('/delete/:config_id', deleteConfiguration)
module.exports = router;