const express = require('express');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const authenticateToken = require('../middleware/authMiddleware');
const Expense = require('../models/expenseSchema');
const router = express.Router();

// CREATE expense
// POST /api/expenses
router.post('/', 
    [
        authenticateToken,
        check('budgetId', 'Invalid budget ID').isMongoId(),
        check('name', 'Name is required').not().isEmpty(),
        check('amount', 'Amount must be a positive number').isFloat({gt: 0}),
        check ('date', 'Date must be a valid ISO date').optional().isISO8601(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        const{budgetId, name, amount, date} = req.body;

        try{
            const newExpense = new Expense({
                userId: req.user.id,
                budgetId,
                name,
                amount,
                date: date || new Date(),
            });

            const savedExpense = await newExpense.save();
            res.status(201).json(savedExpense);
        } catch(err){
            res.status(500).json({message: 'Error creating expense', error: err.message});
        }
});

// READ all expenses for user
// GET /api/expenses
router.get('/', authenticateToken, async(req, res) => {
    try{
        const expenses = await Expense.find({userId: req.user.id});
        res.json(expenses);
    } catch(err){
        res.status(500).json({message: 'Error fetching expenses' , error: err.message});
    }
});

// Provides a summary of expenses grouped by month for user
// GET /api/expenses/summary/monthly
router.get('/summary/monthly', authenticateToken, async (req, res) =>{
    try{
        const monthlySummary = await Expense.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
            { $group: {
                _id: {
                    year: { $year: '$date'},
                    month: { $month: '$date'},
                },
                total : { $sum: '$amount'}, // Total amount for month
            },
        },
        {$sort: { '_id.year': 1, '_id.month': 1} }, // Sort by year and month
        ]);

        res.json(monthlySummary);
    } catch (err){
        res.status(500).json({message: 'Error generating monthly summary', error: err.message});
    }
});

//Update an expense using ID
router.put(
    '/:id',
     [
        authenticateToken,
        check('id', 'Invalid expense ID').isMongoId(),
        check('name', 'Name is required').optional().not().isEmpty(),
        check('amount', 'Amount must be a positive number').optional().isFloat({gt: 0}),
        check('date', 'Date must be a valid ISO date').optional().isISO8601(),
     ],
     async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

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
    }
);

// DELETE an expense by ID
router.delete(
    '/:id',
    [
        authenticateToken,
        check('id', 'Invalid expense ID').isMongoId(),
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array()});
        }

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