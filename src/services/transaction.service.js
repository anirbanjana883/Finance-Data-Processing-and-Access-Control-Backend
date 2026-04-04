import prisma from '../config/db.js'; 
import { ApiError } from '../utils/ApiError.js';

// create transaction 
export const createTransaction = async (data, actingUser) => {
    //category  normalisation
    const normalizedCategory = data.category.toLowerCase().trim();

    return await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                createdById: actingUser.id,
                orgId: actingUser.orgId, 
                amount: data.amount,
                type: data.type, 
                category: normalizedCategory,
                date: data.date ? new Date(data.date) : new Date(),
                notes: data.notes
            }
        });

        await tx.auditLog.create({
            data: {
                orgId: actingUser.orgId,
                actorId: actingUser.id,
                targetId: transaction.id, //  BUG FIX 
                action: 'TRANSACTION_CREATED',
                newValue: `${data.type} of ${data.amount} in ${normalizedCategory}`
            }
        });

        return transaction;
    });
};

// retreve transactions
export const getTransactions = async (actingUser, queryParams) => {
    const { page = 1, limit = 10, type, category, startDate, endDate, search, sortBy = 'date', order = 'desc' } = queryParams;
    
    // BUG FIX - DATE VALIDATION
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new ApiError(400, "Invalid date range: startDate cannot be after endDate");
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = { 
        deletedAt: null,
        status: 'ACTIVE', 
        orgId: actingUser.orgId 
    };

    if (type) where.type = type;
    if (category) where.category = category.toLowerCase().trim();
    
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

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
            where, skip, take: limitNum, 
            orderBy: { [sortBy]: order }, 
            select: {
                id: true, amount: true, type: true, category: true, 
                date: true, notes: true, status: true,
                createdBy: { select: { id: true, name: true, email: true } }
            }
        }),
        prisma.transaction.count({ where })
    ]);

    return { transactions, meta: { totalRecords, currentPage: pageNum, pageSize: limitNum, totalPages: Math.ceil(totalRecords / limitNum) } };
};

// update transaction 
export const updateTransaction = async (transactionId, updateData, actingUser) => {
    // neg. amount guard
    if (updateData.amount !== undefined && updateData.amount <= 0) {
        throw new ApiError(400, "Invalid amount: must be greater than zero");
    }

    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, orgId: actingUser.orgId, status: 'ACTIVE', deletedAt: null } 
    });

    if (!existing) throw new ApiError(404, "Transaction not found");

    const normalizedCategory = updateData.category ? updateData.category.toLowerCase().trim() : undefined;

    return await prisma.$transaction(async (tx) => {
        const updated = await tx.transaction.update({
            where: { id: transactionId },
            data: {
                ...(updateData.amount !== undefined && { amount: updateData.amount }),
                ...(updateData.type && { type: updateData.type }),
                ...(normalizedCategory && { category: normalizedCategory }),
                ...(updateData.date && { date: new Date(updateData.date) }),
                ...(updateData.notes && { notes: updateData.notes })
            }
        });

        await tx.auditLog.create({
            data: {
                orgId: actingUser.orgId,
                actorId: actingUser.id,
                targetId: transactionId, 
                action: 'TRANSACTION_UPDATED',
                // json tracing 
                oldValue: JSON.stringify(existing), 
                newValue: JSON.stringify(updated)
            }
        });

        return updated;
    });
};

// soft delete transaction
export const deleteTransaction = async (transactionId, actingUser) => {
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, orgId: actingUser.orgId, status: 'ACTIVE', deletedAt: null } 
    });

    if (!existing) throw new ApiError(404, "Transaction not found");

    return await prisma.$transaction(async (tx) => {
        const deleted = await tx.transaction.update({
            where: { id: transactionId },
            data: { deletedAt: new Date(), status: 'ARCHIVED' }
        });

        await tx.auditLog.create({
            data: {
                orgId: actingUser.orgId,
                actorId: actingUser.id,
                targetId: transactionId, 
                action: 'TRANSACTION_DELETED',
                oldValue: JSON.stringify(existing),
                newValue: 'ARCHIVED'
            }
        });

        return deleted;
    });
};