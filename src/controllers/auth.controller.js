import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // validation
  if (!name || !email || !password) {
      throw new ApiError(400, "Name, email, and password are required");
  }

  // service
  const { user, token } = await authService.registerUser(name, email, password);

  
  return res.status(201).json(
      new ApiResponse(201, { user, token }, "User registered successfully")
  );
});

// login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // validation
  if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
  }

  // service
  const { user, token } = await authService.loginUser(email, password);

  
  return res.status(200).json(
      new ApiResponse(200, { user, token }, "Login successful")
  );
});