import bcrypt from 'bcryptjs';
import prisma from '../config/db.js'; 
import { ApiError } from '../utils/ApiError.js';

// user craetion admin invites 
export const createUser = async (userData, actingAdmin) => {
    const normalizedEmail = userData.email.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
        where: { email: normalizedEmail, orgId: actingAdmin.orgId, deletedAt: null }
    });
    if (existingUser) throw new ApiError(409, "User already exists in your organization");

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // interactive transaction 
    // Prisma array transactions cannot reference IDs created in earlier steps of the same array
    const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name: userData.name,
                email: normalizedEmail,
                passwordHash,
                role: userData.role,
                orgId: actingAdmin.orgId
            }
        });

        await tx.auditLog.create({
            data: {
                orgId: actingAdmin.orgId,
                actorId: actingAdmin.id,
                targetId: user.id,
                action: 'USER_CREATED',
                newValue: `${userData.role} Created`
            }
        });

        return user;
    });

    return { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, status: newUser.status };
};

// get all user 
export const getAllUsers = async (queryParams, actingAdmin) => {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', order = 'desc' } = queryParams;

    const allowedSortFields = ['createdAt', 'name', 'email', 'role', 'status'];
    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, "Invalid sort field");
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    
    const where = {
        AND: [
            { orgId: actingAdmin.orgId },
            { deletedAt: null }
        ]
    };

    if (status) where.AND.push({ status });

    if (search) {
        where.AND.push({
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        });
    }

    const [users, totalRecords] = await Promise.all([
        prisma.user.findMany({
            where, skip, take: limitNum, orderBy: { [sortBy]: order }, 
            select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
        }),
        prisma.user.count({ where })
    ]);

    return { 
        users, 
        meta: { 
            totalRecords, 
            currentPage: pageNum, 
            pageSize: limitNum, // 🔥 IMP 3: Added pageSize
            totalPages: Math.ceil(totalRecords / limitNum) 
        } 
    };
};

// update role
export const updateUserRole = async (targetUserId, newRole, actingAdmin) => {
    if (targetUserId === actingAdmin.id && newRole !== 'ADMIN') {
        throw new ApiError(400, "Security restriction: You cannot remove your own ADMIN role.");
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new ApiError(404, "User not found");

    // check soft deletetion 
    if (user.deletedAt) throw new ApiError(404, "User not found (deleted)");

    // master admin can not moifi system level user 
    if (user.role === 'MASTER_ADMIN') throw new ApiError(403, "Cannot modify system-level user");

    if (user.orgId !== actingAdmin.orgId) {
        throw new ApiError(403, "You do not have permission to modify this user.");
    }

    if (user.role === newRole) return user; 

    // interactive tramnsaction 
    const updatedUser = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
            where: { id: targetUserId },
            data: { role: newRole },
            select: { id: true, name: true, email: true, role: true, status: true }
        });

        await tx.auditLog.create({
            data: {
                orgId: actingAdmin.orgId,
                actorId: actingAdmin.id,
                targetId: targetUserId,
                action: 'ROLE_UPDATED',
                oldValue: user.role,
                newValue: newRole
            }
        });

        return updated;
    });

    return updatedUser;
};

// status updation
export const updateUserStatus = async (targetUserId, newStatus, actingAdmin) => {
    if (targetUserId === actingAdmin.id && newStatus === 'INACTIVE') {
        throw new ApiError(400, "Security restriction: You cannot deactivate your own account.");
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new ApiError(404, "User not found");
    
    // check soft deletion 
    if (user.deletedAt) throw new ApiError(404, "User not found (deleted)");

    // // master admin can not moifi system level user 
    if (user.role === 'MASTER_ADMIN') throw new ApiError(403, "Cannot modify system-level user");

    if (user.orgId !== actingAdmin.orgId) {
        throw new ApiError(403, "You do not have permission to modify this user.");
    }

    if (user.status === newStatus) return user;

    // interactive transaction 
    const updatedUser = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
            where: { id: targetUserId },
            data: { status: newStatus },
            select: { id: true, name: true, email: true, role: true, status: true }
        });

        await tx.auditLog.create({
            data: {
                orgId: actingAdmin.orgId,
                actorId: actingAdmin.id,
                targetId: targetUserId,
                action: 'STATUS_UPDATED',
                oldValue: user.status,
                newValue: newStatus
            }
        });

        return updated;
    });

    return updatedUser;
};