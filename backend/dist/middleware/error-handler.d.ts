import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    field?: string;
}
export declare class ValidationError extends Error {
    statusCode: number;
    field?: string;
    constructor(message: string, field?: string);
}
export declare class BlockchainError extends Error {
    statusCode: number;
    constructor(message: string);
}
export declare class StorageError extends Error {
    statusCode: number;
    constructor(message: string);
}
export declare function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction): void;
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error-handler.d.ts.map