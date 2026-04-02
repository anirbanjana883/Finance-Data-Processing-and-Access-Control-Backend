import * as transactionService from '../services/transaction.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';


// create transaction
export const create = asyncHandler(async (req, res) => {
    const transaction = await transactionService.createTransaction(req.body, req.user.id);
    return res.status(201).json(
        new ApiResponse(201, transaction, "Transaction created successfully")
    );
});

// get all transaction
export const getAll = asyncHandler(async (req, res) => {
    // role check
    const data = await transactionService.getTransactions(req.user, req.query);
    
    return res.status(200).json({
        success: true,
        message: "Transactions retrieved successfully",
        data: data.transactions,
        meta: data.meta
    });
});

// update transactions
export const update = asyncHandler(async (req, res) => {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);
    return res.status(200).json(
        new ApiResponse(200, transaction, "Transaction updated successfully")
    );
});

// remove transactions
export const remove = asyncHandler(async (req, res) => {
    await transactionService.deleteTransaction(req.params.id);
    return res.status(200).json(
        new ApiResponse(200, null, "Transaction deleted successfully")
    );
});