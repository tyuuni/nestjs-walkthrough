import { TemporaryMonolithicService } from './service/TemporaryMonolithicService';
import { User } from './service/models';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    createParamDecorator,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCode } from './config';

export const SECONDS_IN_A_WEEK = 60 * 60 * 24 * 7;

const userLoginKey = (id: string) => `u:${id}`;

export const saveLoginToken = async (redis: Redis, userId: string) => {
    const token = uuidv4();
    await redis.set(userLoginKey(userId), token, 'EX', SECONDS_IN_A_WEEK);
    return token;
};

export type InjectedLoginUser = User;

export const LoginUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): InjectedLoginUser => {
        const request = ctx.switchToHttp().getRequest<Request>();
        if (!request['loginUser']) {
            throw new Error('fatal logic error');
        }
        return request['loginUser'];
    },
);

@Injectable()
export class Authenticator implements CanActivate {
    constructor(
        private readonly monolithicService: TemporaryMonolithicService,
        private readonly redis: Redis,
    ) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>();
        const userId = request.headers['test-user-id'];
        const token = request.headers['test-user-token'];
        if (!userId || !token) {
            throw new UnauthorizedException({
                code: ErrorCode.MISSING_AUTHORIZATION_HEADER,
                message: 'missing user id or token',
            });
        }
        const existingToken = await this.redis.get(
            userLoginKey(userId as string),
        );
        if (token !== existingToken) {
            throw new UnauthorizedException({
                code: ErrorCode.INVALID_LOGIN_TOKEN,
                message: 'token not match',
            });
        }
        const user = await this.monolithicService.getUserById(userId as string);
        if (!user) {
            // user might be deleted
            throw new UnauthorizedException({
                code: ErrorCode.INVALID_LOGIN_TOKEN,
                message: 'token not found',
            });
        }
        request['loginUser'] = user;
        return true;
    }
}
