import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
    // 🔥 SDE-3 Upgrade: Use safeParse() to completely bypass try/catch traps
    const result = schema.safeParse({
        body: req.body || {},
        query: req.query || {},
        params: req.params || {},
    });
    
    // If validation fails, result.success is false, and result.error is guaranteed to exist
    if (!result.success) {
        const formattedErrors = result.error.issues.map((err) => ({
            field: err.path.join('.'), 
            message: err.message,
        }));
        
        return next(new ApiError(400, "Validation Failed", formattedErrors));
    }

    // If validation succeeds, safely assign the transformed data back to Express
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) Object.assign(req.query, result.data.query);
    if (result.data.params) Object.assign(req.params, result.data.params);
    
    next();
};