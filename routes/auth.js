// Import modules
const express = require('express');
const bcrypt = require('bcryptjs'); // For password comparison
const jwt = require('jsonwebtoken'); // For creating JSON Web Tokens
const User = require('../models/User'); // Import User model
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router(); // Create router object to def and manage routes

router.post('/register', async (req, res) => {
    const {firstName, lastName, email, password} = req.body; // Extracts user input

    // Checks if the email is registered in database
    try{
        const existingUser = await User.findOne({email});
        if (existingUser){
            return res.status(400).json({message: 'Email already in use'}); // returns an error if email is in use
        }

        // Creates new user object
        const newUser = new User({firstName, lastName, email, password});
        
        // Saves the new user data in database
        await newUser.save();

        //Respond with a success message and handles unexpected errors w response error msg
        res.status(201).json({message: 'User registered successfully'});
    } catch(err){
        res.status(500).json({message: 'Error registering user.', error: err.message});
    }
});

router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    
    // Finds the user in the database by email and throws error if the email is not found
    try{
        const user = await User.findOne({email});
        if (!user){
            return res.status(404).json({message: 'User not found'});
        }
        
        // Compare input with hashed password in database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch){
            return res.status(400).json({message: 'Invalid credentials'});
        }
        
        // Generates a JSON Web Token
        const token = jwt.sign(
            {id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'}
        );

        // Respond with the token and user info
        res.json({
            token,
            user:{
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    } catch(err){
        // Handle any error and responds with message
        res.status(500).json({message: 'Error logging in', error: err.message});
    }  
});

// Returns the profile of user and authToken ensures the user logged in before accessing the route

router.get('/profile', authenticateToken, async(req, res) => {
    try{
        //Authenticated by user's ID but excludes password from response
        const user = await User.findById(req.user.id).select('-password');
        if(!user) return res.status(404).json({message: 'User not found.'});

        res.json(user) //Return user info

    } catch(err){
        res.status(500).json({message: 'Error fetching profile.', error: err.message});
    }
});

//Allows user to delete their account and ensures only logged-in users can delete account
router.delete('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        if(!user) return res.status(404).json({message: 'User not found'});

        res.json({message: 'User account deleted successfully'});
    
    } catch(err){
        res.status(500).json({message: 'Error deleting account', error: err.message});
        }
});
//Export the router so it can be with app.js
module.exports = router;