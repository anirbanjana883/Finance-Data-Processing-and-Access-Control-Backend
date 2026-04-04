import { z } from 'zod';

export const bootstrapSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6)
    })
});

export const setupOrganizationSchema = z.object({
    body: z.object({
        orgName: z.string().min(2),
        adminUser: z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(6)
        })
    })
});

// login require org_id but for master admin it is not required
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
        orgId: z.string().uuid("Invalid Organization ID format").optional() 
    })
});