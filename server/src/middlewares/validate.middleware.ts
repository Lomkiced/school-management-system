// FILE: server/src/middlewares/validate.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from './error.middleware';

/**
 * Middleware to validate request data against a Zod schema
 * 
 * @param schema - The Zod schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * router.post('/', validate(createStudentSchema), createStudent);
 */
export const validate = (schema: AnyZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            console.log('✅ Validation passed');
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                console.error('❌ Validation failed:', error.errors);
                // Pass Zod error to global error handler
                next(error);
            } else {
                next(new ApiError(500, 'Internal Validation Error'));
            }
        }
    };
