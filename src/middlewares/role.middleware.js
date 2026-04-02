import { ApiError } from '../utils/ApiError.js';

// /**
//  * Middleware to check if the user has one of the required roles.
//  * @param  {...string} allowedRoles - Array of roles allowed to access the route
//  */

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        //  Ensure req.user exists 
        if (!req.user || !req.user.role) {
            return next(new ApiError(500, "Server Error: Role middleware called without user data"));
        }

        //  Check if the user's role is in the array of allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ApiError(403, `Forbidden: Your role (${req.user.role}) is not allowed to access this resource`));
        }

        next();
    };
};