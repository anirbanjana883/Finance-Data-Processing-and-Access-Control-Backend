import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
    try {
        const validatedData = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        
        if (validatedData.body) req.body = validatedData.body; 
        if (validatedData.query) Object.assign(req.query, validatedData.query);
        if (validatedData.params) Object.assign(req.params, validatedData.params);
        
        next();
    } catch (error) {
        if (error.name === 'ZodError') {
            const formattedErrors = error.errors.map((err) => ({
                field: err.path.join('.'), 
                message: err.message,
            }));
            
            return next(new ApiError(400, "Validation Failed", formattedErrors));
        }

        next(error);
    }
};