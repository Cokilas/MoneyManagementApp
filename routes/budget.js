const express = require('express');
const mongoose = require('mongoose');
const authenticateToken = require('../middleware/authMiddleware');
const Budget = require('../models/budgetSchema');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const Expense = require('../models/expenseSchema');

//Desc: Creates a new budget
// POST /api/budget
router.post(
    '/', 
    [
        // Validation for name, amount, and date
        authenticateToken,
        check('name', 'Name is required').not().isEmpty(),
        check('amount', 'Amount must be a positive number').isFloat({gt: 0}),
        check('startDate', 'Start date must be a valid ISO date').isISO8601(),
        check('endDate', 'End date must be a valid ISO date').isISO8601(),
    ],
     async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        // Extract budget details from the req body
        const{name, amount, startDate, endDate} = req.body;

        try{
            // Creaates a new budget instance w/ provided data and user ID
            const newBudget = new Budget({
                userId: req.user.id,
                name,
                amount,
                startDate,
                endDate,
            });

            // Saves new Budget to database
            const savedBudget = await newBudget.save();

            // Responds with the saved budget
            res.status(201).json(savedBudget);
        } catch (err){
            res.status(500).json({message: 'Error creating budget.', error: err.message});
        }
});

//Desc: Fetches budgets for the user
// GET /api/budget/
router.get('/', authenticateToken, async (req, res) => {
    try{
        //Query the database for budgets
        const budgets = await Budget.find({userId: req.user.id});

        // Respond w/ user's budgets
        res.json(budgets);
    } catch (err){
        // Handles errors
        res.status(500).json({message: 'Error fetching budgets.', error: err.message});
    }
});

// Fetch a specific budget
// GET /api/budget/:id
router.get('/:id',
    [
        authenticateToken,
        check('id', 'Invalid budget ID').isMongoId(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        try {
            const budget = await Budget.findById(req.params.id);
            if(!budget) {
                return res.status(404).json({message: 'Budget not found'});
            }
            res.json(budget);
        } catch (err){
            res.status(500).json({message: 'Error fetching budget', error: err.message});
        }
    }
);

// Calculates the total expenses for a given budget
// GET /api/budget/:id/total-expenses
router.get('/:id/total-expenses',
    [
        authenticateToken,
        check('id', 'Invalid budget ID').isMongoId(),
    ], 
     async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        try{
            const budgetId = req.params.id;

            // Aggregate total expenses for the ID given
            const totalExpenses = await Expense.aggregate([
                { $match: { budgetId: new mongoose.Types.ObjectId(budgetId), userId: new mongoose.Types.ObjectId(req.user.id) } }, // Filter by budgetId and userId
                { $group: { _id: null, total: { $sum: '$amount' } } }, //Calculate total
            ]);

            res.json({totalExpenses: totalExpenses[0]?.total || 0});
        } catch (err){
            res.status(500).json({message: 'Error calculating total expenses', error: err.message});
        }
    }
);

// Calculates the remaining balance for a budget by (-) total expenses from budget amount
// GET /api/budget/:id/balance
router.get('/:id/balance',
    [
        authenticateToken,
        check('id', 'Invalid budget ID').isMongoId(),
    ], 
     async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        try{
            const budgetId = req.params.id;

            //Find the budget
            const budget = await Budget.findById(budgetId);
            if (!budget || budget.userId.toString() !== req.user.id){
                return res.status(404).json({message: 'Budget not found.'});
            }

            // Calculate total expenses
            const totalExpenses = await Expense.aggregate([
                { $match: { budgetId: new mongoose.Types.ObjectId(budgetId), userId: req.user.id } }, // Filter by budgetId and userId
                { $group: { _id: null, total: { $sum: '$amount' } } }, //Calculate total
            ]);

            // Calculate balance
            const totalSpent = totalExpenses[0]?.total || 0;
            const remainingBalance = budget.amount - totalSpent;

            res.json({ remainingBalance, totalSpent });
        
        }catch (err){
            res.status(500).json({message: 'Error calculating balance', error: err.message});
        }
    }
);



// Desc: Update any existing budget by using ID
// PUT /api/budget/:id
router.put(
    '/:id', 
    [
        authenticateToken,
        check('name', 'Name is required').optional().not().isEmpty(),
        check('amount', 'Amount must be a positive number').optional().isFloat({gt: 0}),
        check('startDate', 'Start date must be a valid ISO date').optional().isISO8601(),
        check('endDate', 'End date must be a valid ISO date').optional().isISO8601(),
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

    //Extract update budget details for req body
        const {name, amount, startDate, endDate} = req.body;

        try{
            //Find the budget by ID and update it w/ new data
            const updatedBudget = await Budget.findByIdAndUpdate(
                req.params.id,
                {name, amount, startDate, endDate},
                {new: true} 
            );

            if(!updatedBudget){
                return res.status(404).json({message: 'Budget not found.'});
            }

            res.json(updatedBudget); //Returns the updated budget
        } catch (err){
            res.status(500).json({message: 'Error updating budget', error: err.message})
        }
});

// Desc: Delete a budget
// DELETE /api/budget/:id
router.delete('/:id', 
    [
        authenticateToken,
        check('id', 'Invalid budget ID').isMongoId(),
    ], 
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        try{
            const deletedBudget = await Budget.findByIdAndDelete(req.params.id);

            if(!deletedBudget){
                return res.status(404).json({message: 'Budget not found.'});
            }

            res.json({message: 'Budget deleted successfully'});
        } catch(err){
            res.status(500).json({message: 'Error deleting budget.', error: err.message});
        }
    }
);

module.exports = router;