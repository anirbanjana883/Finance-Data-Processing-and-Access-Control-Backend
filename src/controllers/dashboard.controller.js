import * as dashboardService from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// get summaary for dashboard 
export const getSummary = asyncHandler(async (req, res) => {
    const summaryData = await dashboardService.getDashboardSummary(req.user);

    return res.status(200).json(
        new ApiResponse(200, summaryData, "Dashboard summary generated successfully")
    );
});