import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

const prisma = new PrismaClient();

// get all user optimised with paginaittion
export const getAllUsers = async (page = 1, limit = 10, status) => {
    //  pagination clac.
    const skip = (page - 1) * limit;
    
    const where = status ? { status } : {};

    const [users, totalRecords] = await Promise.all([
        prisma.user.findMany({
            where,
            skip: Number(skip),
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            select: { 
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        }),
        prisma.user.count({ where })
    ]);

    return {
        users,
        meta: {
            totalRecords,
            currentPage: Number(page),
            totalPages: Math.ceil(totalRecords / limit)
        }
    };
};

// updtae role
export const updateUserRole = async (userId, newRole) => {
    const validRoles = ['VIEWER', 'ANALYST', 'ADMIN'];
    if (!validRoles.includes(newRole)) {
        throw new ApiError(400, "Invalid role. Must be VIEWER, ANALYST, or ADMIN.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");

    return await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: { id: true, name: true, email: true, role: true, status: true }
    });
};

// update status
export const updateUserStatus = async (userId, newStatus) => {
    const validStatuses = ['ACTIVE', 'INACTIVE'];
    if (!validStatuses.includes(newStatus)) {
        throw new ApiError(400, "Invalid status. Must be ACTIVE or INACTIVE.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");

    return await prisma.user.update({
        where: { id: userId },
        data: { status: newStatus },
        select: { id: true, name: true, email: true, role: true, status: true }
    });
};