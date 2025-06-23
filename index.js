require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');  // Import socket.io
const path = require('path');


const messageRoutes = require('./routes/messageRoutes');
const chatRoutes = require('./routes/chatRoutes');
const configurationRoutes = require('./routes/configurationRoutes');

const app = express();

// Create HTTP server to attach Socket.io to
const server = http.createServer(app);

// Initialize Socket.io on the same server
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins to connect
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],  // Add allowed headers if needed
    credentials: true,
  },
  transports: ['websocket', 'polling'],  // Allow both WebSocket and polling
});

// Use CORS middleware
app.use(cors({
  origin: '*', // Allow Laravel frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow credentials (like cookies or auth headers) if needed
}));

// MongoDB connection
const uri = process.env.MONGO_URI;
mongoose.connect(uri).then(() => console.log("Database connected")); // Database connection

// Body parser middleware
app.use(bodyParser.json());

// Socket.io event handling
io.on('connection', (socket) => {
  console.log('A user connected');
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Attach the Socket.io instance to the app
app.set('io', io); // This allows access to io in your routes/controllers

// Routes
// Serve static files from the 'uploads' folder
// Test api endpoint for root url 
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/messages', messageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/configuration', configurationRoutes);

// Start the server on the specified port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
