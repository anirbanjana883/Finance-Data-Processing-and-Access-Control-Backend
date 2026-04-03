import prisma from '../config/db.js'; 
import { ApiError } from '../utils/ApiError.js';

// create transaction
export const createTransaction = async (data, actingUser) => {
    let targetUserId;
    if (actingUser.role === 'ADMIN' && data.userId) {
        targetUserId = data.userId;
    } else {
        targetUserId = actingUser.id;
    }

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

// get transactions
export const getTransactions = async (user, queryParams) => {
    const { page = 1, limit = 10, type, category, startDate, endDate, search } = queryParams;
    
    // pagination guard 
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    // Base Condition
    const where = { deletedAt: null };

    // access control
    if (user.role !== 'ADMIN') {
        where.userId = user.id;
    }

    if (type) where.type = type;
    if (category) where.category = category;
    
    // date filter 
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    // prisma filteriang 
    if (search) {
        where.AND = [
            ...(where.AND || []),
            {
                OR: [
                    { category: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } }
                ]
            }
        ];
    }

    const [transactions, totalRecords] = await Promise.all([
        prisma.transaction.findMany({
            where,
            skip: skip,
            take: limitNum,
            orderBy: { date: 'desc' },
            // daat leak guard 
            select: {
                id: true,
                amount: true,
                type: true,
                category: true,
                date: true,
                notes: true,
                userId: true
            }
        }),
        prisma.transaction.count({ where })
    ]);

    return {
        transactions,
        meta: {
            totalRecords,
            currentPage: pageNum,
            totalPages: Math.ceil(totalRecords / limitNum)
        }
    };
};

// update transaction 
export const updateTransaction = async (transactionId, updateData, actingUser) => {
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, deletedAt: null }
    });

    if (!existing) {
        throw new ApiError(404, "Transaction not found");
    }

    if (actingUser.role !== 'ADMIN' && existing.userId !== actingUser.id) {
        throw new ApiError(403, "Not allowed to modify this transaction");
    }

    // partial update 
    return await prisma.transaction.update({
        where: { id: transactionId },
        data: {
            ...(updateData.amount !== undefined && { amount: updateData.amount }),
            ...(updateData.type && { type: updateData.type }),
            ...(updateData.category && { category: updateData.category }),
            ...(updateData.date && { date: new Date(updateData.date) }),
            ...(updateData.notes && { notes: updateData.notes })
        }
    });
};

// delete transaction
export const deleteTransaction = async (transactionId, actingUser) => {
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, deletedAt: null }
    });

    if (!existing) {
        throw new ApiError(404, "Transaction not found");
    }

    if (actingUser.role !== 'ADMIN' && existing.userId !== actingUser.id) {
        throw new ApiError(403, "Not allowed to delete this transaction");
    }

    return await prisma.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() }
    });
};