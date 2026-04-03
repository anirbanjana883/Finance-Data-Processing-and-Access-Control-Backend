import { ApiError } from '../utils/ApiError.js';

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized: No user session found"));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new ApiError(403, `Forbidden: Your role (${req.user.role}) is not allowed`));
        }

        next();
    };
};