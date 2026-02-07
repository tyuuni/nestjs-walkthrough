import {
    Controller,
    Get,
    Put,
    HttpStatus,
    HttpCode,
    Ip,
    Headers,
    Res,
    Req,
    Body,
    PipeTransform,
    ArgumentMetadata,
    Post,
    Patch,
} from '@nestjs/common';
import { TemporaryMonolithicService } from './service/TemporaryMonolithicService';
import Redis from 'ioredis';
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { ErrorCode } from './config';
import { NotAcceptableException } from '@nestjs/common';

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
        if (!user) {
            throw new NotAcceptableException({
                code: ErrorCode.LOGIN_FAILURE_NO_SUCH_USER,
                message: 'user not found',
            });
        }
        return {
            id: user.id,
        };
    }

    @HttpCode(HttpStatus.CREATED)
    @Put('/students')
    async createStudent(@Body() requestBody) {
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
    updateStudent(@Body(tb) body: any) {}
}
