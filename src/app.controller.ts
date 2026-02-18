import {
    Controller,
    Put,
    HttpStatus,
    HttpCode,
    Body,
    Post,
    Param,
    Patch,
    NotAcceptableException,
    UseGuards,
} from '@nestjs/common';
import { TemporaryMonolithicService } from './service/TemporaryMonolithicService';
import Redis from 'ioredis';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ErrorCode } from './config';
import {
    saveLoginToken,
    LoginUser,
    type InjectedLoginUser,
    Authenticator,
    SECONDS_IN_A_WEEK,
} from './authenticator';
import { log } from 'console';

class LoginRequest {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    nfcCardId: string;
}

@Controller()
export class PublicController {
    constructor(
        private readonly monolithicService: TemporaryMonolithicService,
        private readonly redis: Redis,
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post('/login')
    async login(@Body() requestBody: LoginRequest) {
        const user = await this.monolithicService.getUserByNfcCardId(
            requestBody.nfcCardId,
        );
        if (!user) {
            throw new NotAcceptableException({
                code: ErrorCode.LOGIN_FAILURE_NO_SUCH_USER,
                message: 'user not found',
            });
        }
        if (user.name !== requestBody.name) {
            throw new NotAcceptableException({
                code: ErrorCode.LOGIN_FAILURE_NO_SUCH_USER,
                message: 'user not found',
            });
        }
        const token = await saveLoginToken(this.redis, user.id);
        return {
            id: user.id,
            token,
            ttlInSecs: SECONDS_IN_A_WEEK,
        };
    }
}

class UserCreationRequest {
    @IsString()
    @IsNotEmpty()
    nfcCardId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    teacherId: string;

    @IsString()
    @IsNotEmpty()
    createdBy: string;
}

class UserUpdateRequest {
    @IsString()
    @IsOptional()
    name: string;

    @IsString()
    @IsOptional()
    nfcCardId: string;

    @IsString()
    @IsOptional()
    teacherId: string;
}

@Controller()
@UseGuards(Authenticator)
export class AppController {
    constructor(
        private readonly monolithicService: TemporaryMonolithicService,
        private readonly redis: Redis,
    ) {}

    @HttpCode(HttpStatus.CREATED)
    @Put('/students')
    async createStudent(
        @Body() requestBody: UserCreationRequest,
        @LoginUser() loginUser: InjectedLoginUser,
    ) {
        const user = await this.monolithicService.createUser(
            requestBody.nfcCardId,
            requestBody.name,
            true,
            false,
            requestBody.teacherId,
            loginUser.id,
        );
        return {
            id: user.id,
        };
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch('/student/:id')
    async updateStudent(
        @Body() requestBody: UserUpdateRequest,
        @Param('id') id: string,
        @LoginUser() loginUser: InjectedLoginUser,
    ) {
        await this.monolithicService.updateUser(
            id,
            requestBody.nfcCardId,
            requestBody.name,
            requestBody.teacherId,
            loginUser.id,
        );
    }
}
