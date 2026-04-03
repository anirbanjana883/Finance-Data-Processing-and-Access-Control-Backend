import bcrypt from 'bcryptjs';
import prisma from '../config/db.js'; // Use Singleton
import { generateToken } from '../utils/token.js'; // Use Utility
import { ApiError } from '../utils/ApiError.js';

// preventy timing attack migration 
const DUMMY_HASH = process.env.DUMMY_HASH; 

// register user 
export const registerUser = async (name, email, password) => {
  // email normalizqation
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  // 12 round of hashing 
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
    }
  });

  const token = generateToken(user);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }, 
    token
  };
};

// login user
export const loginUser = async (email, password) => {
  // email normalization 
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // time attack prevention 
  // if no user is there still hashhing isd done to create same time for hasing 
  const isMatch = user 
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, DUMMY_HASH);

  if (!user || !isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }, 
    token
  };
};