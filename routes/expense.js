const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const Expense = require('../models/expenseSchema');
const router = express.Router();

// CREATE expense
router.post('/', authenticateToken, async (req, res) => {
    const{budgetId, name, amount, date} = req.body;

    try{
        const newExpense = new Expense({
            userId: req.user.id,
            budgetId,
            name,
            amount,
            date,
        });

        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch(err){
        res.status(500).json({message: 'Error creating expense', error: err.message});
    }
});

// READ all expenses for user
router.get('/', authenticateToken, async(req, res) => {
    try{
        const expenses = await Expense.find({userId: req.user.id});
        res.json(expenses);
    } catch(err){
        res.status(500).json({message: 'Error fetching expenses' , error: err.message});
    }
});

//Update an expense using ID
router.put('/:id', authenticateToken, async(req, res) => {
    const{name, amount, date} = req.body;

    try{
        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            {name, amount, date},
            {new: true}
        );

        if(!updatedExpense){
            res.status(404).json({message: 'Expense not found'});
        }
        
        res.json(updatedExpense);
    } catch (err){
        res.status(500).json({message: 'Error updating expense', error: err.message});
    }
});

// DELETE an expense by ID
router.delete('/:id', authenticateToken, async(req, res) => {
    try{
        const deletedExpense = await Expense.findByIdAndDelete(req.params.id);

        if (!deletedExpense){
            return res.status(404).json({message: 'Expense not found', })
        }

        res.json({message: 'Expense deleted successfully'});
    } catch (err){
        res.status(500).json({message: 'Error deleting expense', error: err.message});
    }
});

module.exports = router;