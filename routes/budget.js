const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const Budget = require('../models/budgetSchema');
const router = express.Router();

//Desc: Creates a new budget

router.post('/', authenticateToken, async(req, res) => {
    console.log('Request Body:', req.body);

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

// Desc: Update any existing budget by using ID

router.put('/:id', authenticateToken, async (req, res) => {
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

router.delete('/:id', authenticateToken, async(req, res) => {
    try{
        const deletedBudget = await Budget.findByIdAndDelete(req.params.id);

        if(!deletedBudget){
            return res.status(404).json({message: 'Budget not found.'});
        }

        res.json({message: 'Budget deleted successfully'});
    } catch(err){
        res.status(500).json({message: 'Error deleting budget.', error: err.message});
    }
});

module.exports = router;