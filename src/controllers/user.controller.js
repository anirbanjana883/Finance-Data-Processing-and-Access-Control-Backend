import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// get all user 
export const getUsers = asyncHandler(async (req, res) => {
    // Extract optional query params (e.g., /api/users?page=1&limit=10&status=ACTIVE)
    const { page, limit, status } = req.query;

    const data = await userService.getAllUsers(page, limit, status);

    return res.status(200).json(
        new ApiResponse(200, data, "Users retrieved successfully")
    );
});

// change role of all users
export const changeRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await userService.updateUserRole(id, role);

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User role updated successfully")
    );
});

// chamge status of iusers
export const changeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const updatedUser = await userService.updateUserStatus(id, status);

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User status updated successfully")
    );
});