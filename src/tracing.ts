import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { TypeormInstrumentation } from 'opentelemetry-instrumentation-typeorm';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestMiddleware, Logger, LoggerService } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import {
    Logger as TypeormLogger,
    LogLevel,
    LogMessage,
    QueryRunner,
} from 'typeorm';
import { formatWithArray } from './pg-format';
import { APP_NAME, APP_VERSION } from './config';

const contextManager = new AsyncLocalStorageContextManager();
contextManager.enable();

context.setGlobalContextManager(contextManager);

const tracerProvider = new NodeTracerProvider({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: APP_NAME,
        [ATTR_SERVICE_VERSION]: APP_VERSION,
    }),
    spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
});

tracerProvider.register();

registerInstrumentations({
    tracerProvider,
    instrumentations: [
        new TypeormInstrumentation({
            enabled: true,
            enableInternalInstrumentation: true,
        }),
        new IORedisInstrumentation({
            enabled: true,
        }),
    ],
});

const tracer = tracerProvider.getTracer('default');

export class TracingLogger implements LoggerService {
    private readonly delegate: Logger;

    constructor(context: string) {
        this.delegate = new Logger(context);
    }

    private callDelegate(
        method: keyof LoggerService,
        message: string,
        ...optionalParams: any[]
    ) {
        const span = trace.getActiveSpan();
        if (span) {
            const spanContext = span.spanContext();
            this.delegate[method](
                `${spanContext.traceId} ${spanContext.spanId} ${message}`,
                ...optionalParams,
            );
        } else {
            this.delegate[method](message, ...optionalParams);
        }
    }

    public log(message: string, ...optionalParams: any[]) {
        this.callDelegate('log', message, ...optionalParams);
    }

    public error(message: any, ...optionalParams: any[]) {
        this.callDelegate('error', message, ...optionalParams);
    }

    public warn(message: string, ...optionalParams: any[]) {
        this.callDelegate('warn', message, ...optionalParams);
    }

    public debug(message: string, ...optionalParams: any[]) {
        this.callDelegate('debug', message, ...optionalParams);
    }

    public verbose(message: string, ...optionalParams: any[]) {
        this.callDelegate('verbose', message, ...optionalParams);
    }

    public fatal(message: string, ...optionalParams: any[]) {
        this.callDelegate('fatal', message, ...optionalParams);
    }
}

export class Tracer implements NestMiddleware {
    private readonly logger: TracingLogger;

    constructor() {
        this.logger = new TracingLogger('Tracer');
    }

    use(req: Request, res: Response, next: NextFunction) {
        const startTime = Date.now();
        const span = tracer.startSpan('http', {
            attributes: {
                'http.method': req.method,
                'http.url': req.originalUrl,
            },
        });

        const ctx = trace.setSpan(context.active(), span);

        res.on('error', (err) => {
            span.setStatus({
                code: SpanStatusCode.ERROR,
            });
            this.logger.error(
                `${span.spanContext().traceId} ${span.spanContext().spanId} an error occurred. `,
                err,
            );
        });

        res.on('close', () => {
            span.setStatus({
                code: SpanStatusCode.OK,
            });
            if (!res.writableEnded) {
                // TODO: look into why context is lost when user aborts request
                this.logger.log(
                    `${span.spanContext().traceId} ${span.spanContext().spanId} user aborted ${req.method}:${req.originalUrl} ${Date.now() - startTime}ms`,
                );
            } else {
                this.logger.log(
                    `finished processing ${req.method}:${req.originalUrl} ${Date.now() - startTime}ms`,
                );
            }
            span.end();
        });

        context.with(ctx, () => {
            this.logger.log(
                `start processing ${req.method}:${req.originalUrl}}`,
            );
            next();
        });
    }
}

export class TracingTypeormLogger implements TypeormLogger {
    private readonly logger: TracingLogger;

    constructor() {
        this.logger = new TracingLogger('typeorm');
    }

    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        this.logger.log(`${formatWithArray(query, parameters)}`);
    }

    logQueryError(
        error: string | Error,
        query: string,
        parameters?: any[],
        queryRunner?: QueryRunner,
    ) {
        this.logger.error(error);
    }

    logQuerySlow(
        time: number,
        query: string,
        parameters?: any[],
        queryRunner?: QueryRunner,
    ) {
        this.logger.warn(`took ${time}ms`);
    }

    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        this.logger.log(message);
    }

    logMigration(message: string, queryRunner?: QueryRunner) {
        this.logger.fatal('should never run migration', message);
    }

    log(
        level: 'log' | 'info' | 'warn',
        message: any,
        queryRunner?: QueryRunner,
    ) {
        this.logger[level](message);
    }
}
