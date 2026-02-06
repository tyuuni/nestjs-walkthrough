import { Redis } from 'ioredis';
import { NestFactory } from '@nestjs/core';
import pino from 'pino';
import { TypeOrmPinoLogger } from 'typeorm-pino-logger';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { QueryRunner, DataSource } from 'typeorm';
import { User, Course, CourseStudentRef } from './service/models';
import { TemporaryMonolithicService } from './service/TemporaryMonolithicService';
import { Module, MiddlewareConsumer, Injectable } from '@nestjs/common';
import { AppController } from './app.controller';
import { Tracer } from './middleware/tracer';

type Class<T = any> = new (...args: any[]) => T;

const anonymizeClass = <Clazz extends Class>(clazz: Clazz): Clazz => {
    return class extends clazz {
        constructor(...params) {
            super(...params);
        }
    };
};

const logger = pino();

class TracingTypeOrmPinoLogger extends TypeOrmPinoLogger {
    logQuery(query: string, parameters?: unknown[], queryRunner?: QueryRunner) {
        const tracer = trace.getTracer('typeorm-pino-logger');
        const span = tracer.startSpan('db.query', {
            attributes: {
                'db.statement': query,
                'db.system': 'postgresql',
                // @ts-ignore
                'db.name': queryRunner?.connection?.options?.database,
            },
        });

        context.with(trace.setSpan(context.active(), span), () => {
            super.logQuery(query, parameters, queryRunner);
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
        });
    }

    logQueryError(
        error: string | Error,
        query: string,
        parameters?: unknown[],
        queryRunner?: QueryRunner,
    ) {
        const tracer = trace.getTracer('typeorm-pino-logger');
        const span = tracer.startSpan('db.query.error', {
            attributes: {
                'db.statement': query,
                'db.system': 'postgresql',
                // @ts-ignore
                'db.name': queryRunner?.connection?.options?.database,
            },
        });

        context.with(trace.setSpan(context.active(), span), () => {
            super.logQueryError(error, query, parameters, queryRunner);
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: typeof error === 'string' ? error : error.message,
            });
            span.end();
        });
    }
}

const bootstrap = async () => {
    logger.info('Bootstraping...');
    logger.info('connecting to database...');
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        logger: new TracingTypeOrmPinoLogger(logger),
        entities: [User, Course, CourseStudentRef],
    });
    try {
        await dataSource.initialize();
    } catch (error) {
        logger.error(error, 'failed to connect to database.');
        process.exit(1);
    }
    logger.info('connected to database.');

    logger.info('connecting to redis...');
    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB),
        lazyConnect: true,
    });
    try {
        await redis.connect();
    } catch (error) {
        logger.error(error, 'failed to connect to redis.');
        process.exit(1);
    }
    logger.info('connected to redis.');

    Injectable()(TemporaryMonolithicService);

    const monolithicService = new TemporaryMonolithicService(
        dataSource.getRepository(User),
        dataSource.getRepository(Course),
        dataSource.getRepository(CourseStudentRef),
    );

    @Module({
        imports: [],
        controllers: [AppController],
        providers: [
            {
                provide: TemporaryMonolithicService,
                useValue: monolithicService,
            },
        ],
    })
    class AppModule {
        configure(consumer: MiddlewareConsumer) {
            consumer.apply(Tracer).forRoutes('*');
        }
    }

    const app = await NestFactory.create(AppModule);

    await app.listen(process.env.PORT ?? 3000);

    const gracefulshutdown = async () => {
        try {
            logger.info('closing database connection...');
            await dataSource.destroy();
            logger.info('database connection closed.');
            await app.close();
            logger.info('application gracefully shutdown.');
            process.exit(0);
        } catch (error) {
            console.log(error);
            logger.error('application shutdown failed. ', error);
            process.exit(1);
        }
    };

    for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
        process.on(signal, async () => {
            logger.info(`process received signal ${signal}, shutting down...`);
            await gracefulshutdown();
        });
    }
};

bootstrap();
