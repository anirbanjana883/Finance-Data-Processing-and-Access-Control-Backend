import jwt from 'jsonwebtoken';

export const generateToken = (user) => {

  const payload = { 
    id: user.id, 
    role: user.role, 
    orgId: user.orgId 
  };

  return jwt.sign(
    payload, 
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } 
  );
};