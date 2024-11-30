// Import requires modules
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const budgetRoutes = require('./routes/budget');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expense');

// Loads environment variables from the .env file
dotenv.config();

// Initialize the Express app
const app = express();

// Allows server to accept requests from a diff domain(frontend app)
app.use(cors());

// When a client sends a request with JSON, express will convert into JavaScript obj
app.use(express.json());

// will return a simple response to test if server is working
app.use('/api/budget', budgetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// MDB Connectiojn setup using Mongoose
mongoose
    .connect(process.env.MONGO_URI) //Connects to MDB database using the URL from .env
    .then(() => console.log('Mongo connected')) // Success message if connection works
    .catch((err) => console.error('Database connection error:', err)); //Logs any errors during the connection process


//Start server and listens for requests & Server listens on a port
const PORT = process.env.PORT || 5000; //Use PORT environment variable or default to 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);