import prisma from '../config/db.js'; 
import { ApiError } from '../utils/ApiError.js';

export const getAllUsers = async (queryParams) => {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', order = 'desc' } = queryParams;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    
    // prevent returnnning deleted user 
    const where = { deletedAt: null };

    if (status) {
        where.status = status; // zod validastion 
    }

    // fuzzy search 
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [users, totalRecords] = await Promise.all([
        prisma.user.findMany({
            where,
            skip: skip,
            take: limitNum,
            orderBy: { [sortBy]: order }, 
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
            currentPage: pageNum,
            totalPages: Math.ceil(totalRecords / limitNum)
        }
    };
};

export const updateUserRole = async (targetUserId, newRole, actingAdminId) => {
    // admin self role demotion lock
    if (targetUserId === actingAdminId && newRole !== 'ADMIN') {
        throw new ApiError(400, "Security restriction: You cannot remove your own ADMIN role.");
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new ApiError(404, "User not found");

    const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
        select: { id: true, name: true, email: true, role: true, status: true }
    });

    // audit logging 
    console.log(`[AUDIT] Admin ${actingAdminId} changed role of user ${targetUserId} to ${newRole}`);

    return updatedUser;
};

export const updateUserStatus = async (targetUserId, newStatus, actingAdminId) => {
    // self deactivation lock 
    if (targetUserId === actingAdminId && newStatus === 'INACTIVE') {
        throw new ApiError(400, "Security restriction: You cannot deactivate your own account.");
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new ApiError(404, "User not found");

    const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { status: newStatus },
        select: { id: true, name: true, email: true, role: true, status: true }
    });

    // audit logging 
    console.log(`[AUDIT] Admin ${actingAdminId} changed status of user ${targetUserId} to ${newStatus}`);

    return updatedUser;
};