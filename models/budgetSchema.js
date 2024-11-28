const mongoose = require('mongoose');

// Defining the schema for Budget
const BudgetSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    name: {type: String, required: true},
    amount: {type: Number, required:true},
    startDate: {type:Date, required: true},
    endDate: {type:Date, required: true},
}, {timestamps: true});

module.exports = mongoose.model('budgetSchema', BudgetSchema)