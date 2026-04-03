import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        
        next();
    } catch (error) {
        const formattedErrors = error.errors.map((err) => ({
            field: err.path.join('.'), 
            message: err.message,
        }));

        next(new ApiError(400, "Validation Failed", formattedErrors));
    }
};