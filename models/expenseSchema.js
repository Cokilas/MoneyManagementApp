const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // Ref to the user
    budgetId: {type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true}, // Ref to budget
    name: {type: String, required: true}, // Name of expense
    amount: {type: String, required: true}, // Amount spent
    date: {type: Date, default: Date.now},
});

module.exports = mongoose.model('Expense', ExpenseSchema);