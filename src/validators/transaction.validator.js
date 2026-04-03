import { z } from 'zod';

export const transactionQuerySchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        type: z.enum(['INCOME', 'EXPENSE']).optional(),
        category: z.string().optional(),
        startDate: z.string().optional(), 
        endDate: z.string().optional(),
        search: z.string().optional()
    })
});

export const createTransactionSchema = z.object({
    body: z.object({
        amount: z.number().positive("Amount must be strictly greater than 0"),
        type: z.enum(['INCOME', 'EXPENSE'], {
            errorMap: () => ({ message: "Type must be INCOME or EXPENSE" })
        }),
        category: z.string().min(1, "Category is required"),
        date: z.string().optional(), 
        notes: z.string().optional(),
        userId: z.string().uuid("Invalid user ID format").optional()
    })
});

export const updateTransactionSchema = z.object({
    body: z.object({
        amount: z.number().positive("Amount must be strictly greater than 0").optional(),
        type: z.enum(['INCOME', 'EXPENSE']).optional(),
        category: z.string().min(1).optional(),
        date: z.string().optional(),
        notes: z.string().optional()
    })
});