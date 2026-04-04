import * as dashboardService from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getSummary = asyncHandler(async (req, res) => {
    const dashboardData = await dashboardService.getDashboardSummary(req.user);

    return res.status(200).json(
        new ApiResponse(200, dashboardData, "Professional Dashboard analytics generated successfully")
    );
});