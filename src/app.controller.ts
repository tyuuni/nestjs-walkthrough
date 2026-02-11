import {
    Controller,
    Put,
    HttpStatus,
    HttpCode,
    Body,
    PipeTransform,
    ArgumentMetadata,
    Post,
    Param,
    Patch,
} from '@nestjs/common';
import { TemporaryMonolithicService } from './service/TemporaryMonolithicService';
import Redis from 'ioredis';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ErrorCode } from './config';
import { NotAcceptableException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

const tb: PipeTransform<any, any> = {
    transform(value: any, metadata: ArgumentMetadata) {
        console.log(value, metadata);
        return value;
    },
};

class LoginRequest {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    nfcCardId: string;
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

const SECONDS_IN_A_WEEK = 60 * 60 * 24 * 7;

@Controller('/')
export class AppController {
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
        await new Promise((resolve) => setTimeout(resolve, 5000));
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
        const token = uuidv4();
        await this.redis.set(`u:${user.id}`, token, 'EX', SECONDS_IN_A_WEEK);

        return {
            id: user.id,
            token,
            ttlInSecs: SECONDS_IN_A_WEEK,
        };
    }

    @HttpCode(HttpStatus.CREATED)
    @Put('/students')
    async createStudent(@Body() requestBody: UserCreationRequest) {
        const user = await this.monolithicService.createUser(
            requestBody.nfcCardId,
            requestBody.name,
            true,
            false,
            requestBody.teacherId,
            requestBody.createdBy,
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
    ) {
        await this.monolithicService.updateUser(
            id,
            requestBody.nfcCardId,
            requestBody.name,
            requestBody.teacherId,
            '',
        );
    }
}
