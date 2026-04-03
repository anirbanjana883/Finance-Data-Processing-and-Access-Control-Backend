// src/controllers/transaction.controller.js
import * as transactionService from '../services/transaction.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// create transaction
export const create = asyncHandler(async (req, res) => {
    const transaction = await transactionService.createTransaction(req.body, req.user); 
    return res.status(201).json(
        new ApiResponse(201, transaction, "Transaction created successfully")
    );
});

// get all transaction
export const getAll = asyncHandler(async (req, res) => {
    const data = await transactionService.getTransactions(req.user, req.query);
    
    return res.status(200).json({
        success: true,
        message: "Transactions retrieved successfully",
        data: data.transactions,
        meta: data.meta
    });
});

// update transaction
export const update = asyncHandler(async (req, res) => {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body, req.user); 
    return res.status(200).json(
        new ApiResponse(200, transaction, "Transaction updated successfully")
    );
});

// delete transaction 
export const remove = asyncHandler(async (req, res) => {
    await transactionService.deleteTransaction(req.params.id, req.user); 
    return res.status(200).json(
        new ApiResponse(200, null, "Transaction deleted successfully")
    );
});