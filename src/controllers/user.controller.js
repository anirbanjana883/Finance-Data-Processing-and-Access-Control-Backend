import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getUsers = asyncHandler(async (req, res) => {
    const data = await userService.getAllUsers(req.query);

    return res.status(200).json(
        new ApiResponse(200, data, "Users retrieved successfully")
    );
});

export const changeRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.id; 

    const updatedUser = await userService.updateUserRole(id, role, adminId);

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User role updated successfully")
    );
});

export const changeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id; 

    const updatedUser = await userService.updateUserStatus(id, status, adminId);

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User status updated successfully")
    );
});