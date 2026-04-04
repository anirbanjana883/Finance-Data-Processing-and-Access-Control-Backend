import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const bootstrap = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const data = await authService.bootstrapMaster(name, email, password);
    return res.status(201).json(new ApiResponse(201, data, "System bootstrapped successfully"));
});

export const setupOrganization = asyncHandler(async (req, res) => {
    const { orgName, adminUser } = req.body;
    const data = await authService.createOrganization(orgName, adminUser, req.user);
    return res.status(201).json(new ApiResponse(201, data, "Organization and Admin created successfully"));
});

export const login = asyncHandler(async (req, res) => {
    const { email, password, orgId } = req.body;
    
    const data = await authService.loginUser(email, password, orgId);
    
    return res.status(200).json(new ApiResponse(200, data, "Login successful"));
});