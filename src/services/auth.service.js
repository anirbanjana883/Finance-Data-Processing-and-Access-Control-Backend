import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js'; 

const prisma = new PrismaClient();

// register
export const registerUser = async (name, email, password) => {
  // user existaance check
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  // hashing
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // creating user 
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      // role defaults to VIEWER, status defaults to ACTIVE based on schema
    }
  });

  // jwt token generation
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    token
  };
};

// login
export const loginUser = async (email, password) => {
  // finding user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // activeness of user checked
  if (user.status === 'INACTIVE') {
    throw new ApiError(403, 'This account has been deactivated by an Administrator');
  }
  if (user.deletedAt !== null) {
    throw new ApiError(404, 'This account no longer exists');
  }

  // password verification
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // jwt token generation
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    user: { id: user.id, email: user.email, role: user.role, status: user.status },
    token
  };
};