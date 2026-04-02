import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

const prisma = new PrismaClient();

// create transaction
export const createTransaction = async (data, actingUserId) => {
    //  Validation (Must be strictly > 0)
    if (Number(data.amount) <= 0) {
        throw new ApiError(400, "Amount must be strictly greater than 0");
    }

    const targetUserId = data.userId || actingUserId;

    return await prisma.transaction.create({
        data: {
            userId: targetUserId,
            amount: data.amount,
            type: data.type, 
            category: data.category,
            date: data.date ? new Date(data.date) : new Date(),
            notes: data.notes
        }
    });
};

// retreve transaction
export const getTransactions = async (user, queryParams) => {
    const { page = 1, limit = 10, type, category, startDate, endDate, search } = queryParams;
    const skip = (page - 1) * limit;

    // hidiing soft delete record
    const where = { deletedAt: null };

    // Access Control
    if (user.role === 'VIEWER') {
        where.userId = user.id;
    }

    //  Dynamic Filters
    if (type) where.type = type;
    if (category) where.category = category;
    
    if (startDate && endDate) {
        where.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    //  Fuzzy Search 
    if (search) {
        where.OR = [
            { category: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [transactions, totalRecords] = await Promise.all([
        prisma.transaction.findMany({
            where,
            skip: Number(skip),
            take: Number(limit),
            orderBy: { date: 'desc' }
        }),
        prisma.transaction.count({ where })
    ]);

    return {
        transactions,
        meta: {
            totalRecords,
            currentPage: Number(page),
            totalPages: Math.ceil(totalRecords / limit)
        }
    };
};

// update transaction
export const updateTransaction = async (transactionId, updateData) => {
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, deletedAt: null }
    });

    if (!existing) {
        throw new ApiError(404, "Transaction not found");
    }

    if (updateData.amount !== undefined && Number(updateData.amount) <= 0) {
        throw new ApiError(400, "Amount must be strictly greater than 0");
    }

    return await prisma.transaction.update({
        where: { id: transactionId },
        data: {
            amount: updateData.amount,
            type: updateData.type,
            category: updateData.category,
            date: updateData.date ? new Date(updateData.date) : undefined,
            notes: updateData.notes
        }
    });
};

// delete transactions
export const deleteTransaction = async (transactionId) => {
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, deletedAt: null }
    });

    if (!existing) {
        throw new ApiError(404, "Transaction not found");
    }

    // Soft delete
    return await prisma.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() }
    });
};