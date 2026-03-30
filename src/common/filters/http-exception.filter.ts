import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : (exception as Error).message || 'Error interno del servidor';

        const errorLog = `
--- ERROR ---
Timestamp: ${new Date().toISOString()}
Path: ${request.url}
Status: ${status}
Message: ${JSON.stringify(message)}
Stack: ${(exception as Error).stack}
-------------
`;
        require('fs').appendFileSync('error_debug.log', errorLog);

        this.logger.error(
            `Http Status: ${status} Error Message: ${JSON.stringify(message)}`,
            (exception as Error).stack,
        );

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: typeof message === 'string' ? message : (message as any).message || message,
        });
    }
}
