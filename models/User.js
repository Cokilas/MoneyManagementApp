const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For hashing passwords

//Define the User schema
//Includes basic user info such as name, email, and password
const UserSchema = new mongoose.Schema({
    fisrtName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
}, {timestamps: true}); // Adds createdAt and updateAt timestamps

// Pre-save to hash ther passweord before saving it to the database
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // Skip if password is not modified
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password with salt
    next(); //Proceed to save
});

//Exports the User model
module.exports = mongoose.model('User', UserSchema);