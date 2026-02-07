import { Redis } from 'ioredis';
import { NestFactory } from '@nestjs/core';
// opentelemetry should be initialized before tools: typeorm
import { Tracer, TracingLogger, TracingTypeormLogger } from './tracing';
import { DataSource } from 'typeorm';
import { User, Course, CourseStudentRef } from './service/models';
import { TemporaryMonolithicService } from './service/TemporaryMonolithicService';
import { Module, MiddlewareConsumer, Injectable } from '@nestjs/common';
import { AppController } from './app.controller';
import { RequestFormatValidationPipe } from './pipes';

type Class<T = any> = new (...args: any[]) => T;

const anonymizeClass = <Clazz extends Class>(clazz: Clazz): Clazz => {
    return class extends clazz {
        constructor(...params) {
            super(...params);
        }
    };
};

const logger = new TracingLogger('main');

const bootstrap = async () => {
    logger.log('Bootstraping...');

    logger.log('connecting to database...');
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        logger: new TracingTypeormLogger(),
        entities: [User, Course, CourseStudentRef],
    });
    try {
        await dataSource.initialize();
    } catch (error) {
        logger.error(error, 'failed to connect to database.');
        process.exit(1);
    }
    logger.log('connected to database.');

    logger.log('connecting to redis...');
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
    logger.log('connected to redis.');

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
            {
                provide: Redis,
                useValue: redis,
            },
        ],
    })
    class AppModule {
        configure(consumer: MiddlewareConsumer) {
            consumer.apply(Tracer).forRoutes('*');
        }
    }

    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new RequestFormatValidationPipe());

    const serverPort = process.env.PORT ?? 3000;

    await app.listen(serverPort);
    logger.log(`application is running on port ${serverPort}`);

    const gracefulshutdown = async () => {
        try {
            logger.log('closing database connection...');
            await dataSource.destroy();
            logger.log('database connection closed.');
            logger.log('closing redis connection...');
            await redis.quit();
            logger.log('redis connection closed.');
            await app.close();
            logger.log('application gracefully shutdown.');
            process.exit(0);
        } catch (error) {
            console.log(error);
            logger.error('application shutdown failed. ', error);
            process.exit(1);
        }
    };

    for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
        process.on(signal, async () => {
            logger.log(`process received signal ${signal}, shutting down...`);
            await gracefulshutdown();
        });
    }
};

bootstrap();
