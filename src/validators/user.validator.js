import { z } from 'zod';

export const userQuerySchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'name', 'email', 'role', 'status']).optional(),
        order: z.enum(['asc', 'desc']).optional(),
    })
});

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Temporary password must be at least 6 characters"),
        role: z.enum(['VIEWER', 'ANALYST', 'ADMIN'], {
            errorMap: () => ({ message: "Role must be VIEWER, ANALYST, or ADMIN" })
        })
    })
});

export const updateRoleSchema = z.object({
    body: z.object({
        role: z.enum(['VIEWER', 'ANALYST', 'ADMIN'], {
            errorMap: () => ({ message: "Role must be VIEWER, ANALYST, or ADMIN" })
        })
    })
});

export const updateStatusSchema = z.object({
    body: z.object({
        status: z.enum(['ACTIVE', 'INACTIVE'], {
            errorMap: () => ({ message: "Status must be ACTIVE or INACTIVE" })
        })
    })
});