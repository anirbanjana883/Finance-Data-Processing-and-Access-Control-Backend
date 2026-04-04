import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// admin create employee in own organisation 
export const create = asyncHandler(async (req, res) => {
    const newUser = await userService.createUser(req.body, req.user);
    return res.status(201).json(new ApiResponse(201, newUser, "User successfully added to your organization"));
});

// get all user or search user 
export const getUsers = asyncHandler(async (req, res) => {
    const data = await userService.getAllUsers(req.query, req.user);
    return res.status(200).json(new ApiResponse(200, data, "Users retrieved successfully"));
});

// change role of user 
export const changeRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const updatedUser = await userService.updateUserRole(id, role, req.user);

    return res.status(200).json(new ApiResponse(200, updatedUser, "User role updated successfully"));
});

// change status of user 
export const changeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const updatedUser = await userService.updateUserStatus(id, status, req.user);

    return res.status(200).json(new ApiResponse(200, updatedUser, "User status updated successfully"));
});