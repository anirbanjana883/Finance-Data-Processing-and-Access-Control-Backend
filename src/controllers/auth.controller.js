import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const { user, token } = await authService.registerUser(name, email, password);

  return res.status(201).json(
      new ApiResponse(201, { user, token }, "User registered successfully")
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.loginUser(email, password);

  return res.status(200).json(
      new ApiResponse(200, { user, token }, "Login successful")
  );
});