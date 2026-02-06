import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { context, trace } from '@opentelemetry/api';

const contextManager = new AsyncLocalStorageContextManager();

const initOpenTelemetry = () => {
    const tracerProvider = new NodeTracerProvider({
        spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
    });
    tracerProvider.register();

    context.setGlobalContextManager(contextManager);
};

initOpenTelemetry();

@Injectable()
export class Tracer implements NestMiddleware {
    private readonly tracer = trace.getTracer('Tracer');

    use(req: Request, res: Response, next: NextFunction) {
        const span = this.tracer.startSpan('http');
        const ctx = trace.setSpan(context.active(), span);
        context.with(ctx, next);
        span.end();
    }
}
