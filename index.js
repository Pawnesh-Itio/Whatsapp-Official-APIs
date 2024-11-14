require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const messageRoutes = require('./routes/messageRoutes');
const configurationRoutes = require('./routes/configurationRoutes');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
// Use CORS middleware
app.use(cors({
  origin: '*', // Allow Laravel frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Allow credentials (like cookies or auth headers) if needed
}));

const uri = process.env.MONGO_URI;
mongoose.connect(uri).then(()=>console.log("Database connected"));// Database connection

app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// Routes
app.use('/api/messages', messageRoutes);
app.use('/api/configuration',configurationRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
