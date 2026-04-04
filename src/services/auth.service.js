import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { generateToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

const DUMMY_HASH = process.env.DUMMY_HASH || '$2a$12$DUMMYHASHFORPREVENTINGTIMINGATTACKSDUMMYHASH'; 

// system bootstarp
export const bootstrapMaster = async (name, email, password) => {
    const existingMaster = await prisma.user.findFirst({ where: { role: 'MASTER_ADMIN' } });
    if (existingMaster) throw new ApiError(403, "System is already bootstrapped.");

    const salt = await bcrypt.genSalt(12);
    const masterAdmin = await prisma.user.create({
        data: {
            name,
            email: email.toLowerCase().trim(),
            passwordHash: await bcrypt.hash(password, salt),
            role: 'MASTER_ADMIN',
            orgId: null 
        }
    });

    return { user: { id: masterAdmin.id, name: masterAdmin.name, email: masterAdmin.email, role: masterAdmin.role }, token: generateToken(masterAdmin) };
};

// tenant creatyion
export const createOrganization = async (orgName, adminData, actingUser) => {
    if (actingUser.role !== 'MASTER_ADMIN') throw new ApiError(403, "Only MASTER_ADMIN can create organizations");

    const existingOrg = await prisma.organization.findUnique({ where: { name: orgName } });
    if (existingOrg) throw new ApiError(409, "Organization name already taken.");

    const normalizedEmail = adminData.email.toLowerCase().trim();
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(adminData.password, salt);

    // db transaction
    const [newOrg, newAdmin] = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({ data: { name: orgName } });

        const admin = await tx.user.create({
            data: {
                name: adminData.name,
                email: normalizedEmail,
                passwordHash,
                role: 'ADMIN',
                orgId: org.id
            }
        });

        await tx.auditLog.create({
            data: {
                orgId: org.id,
                actorId: actingUser.id,
                targetId: admin.id,
                action: 'USER_CREATED', 
                newValue: 'ADMIN Created'
            }
        });

        return [org, admin];
    });

    return { organization: newOrg, admin: { id: newAdmin.id, email: newAdmin.email, role: newAdmin.role, orgId: newAdmin.orgId } };
};

// login
export const loginUser = async (email, password, loginOrgId) => {
    const normalizedEmail = email.toLowerCase().trim();
    
    const whereClause = loginOrgId 
        ? { email: normalizedEmail, orgId: loginOrgId }
        : { email: normalizedEmail, role: 'MASTER_ADMIN' };

    const user = await prisma.user.findFirst({ 
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            orgId: true,
            passwordHash: true 
        }
    });

    // dummy hash is used to halusinate the hacker
    const isMatch = user 
        ? await bcrypt.compare(password, user.passwordHash)
        : await bcrypt.compare(password, DUMMY_HASH);

    if (!user || !isMatch) {
         if (!loginOrgId && user?.role !== 'MASTER_ADMIN') {
             throw new ApiError(400, 'Organization ID is required for non - Master-Admin users');
         }
         throw new ApiError(401, 'Invalid email, password, or Organization ID');
    }

    if (user.status === 'INACTIVE') throw new ApiError(403, 'Account is deactivated.');

    if (user.orgId) {
        await prisma.auditLog.create({
            data: {
                orgId: user.orgId,
                actorId: user.id,
                action: 'USER_LOGIN' 
            }
        });
    }

    const token = generateToken(user); 

    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId }, 
        token
    };
};