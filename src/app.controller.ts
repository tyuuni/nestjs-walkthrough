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
import type { Request, Response } from 'express';
import { TemporaryMonolithicService } from './service/TemporaryMonolithicService';

const tb: PipeTransform<any, any> = {
    transform(value: any, metadata: ArgumentMetadata) {
        console.log(value, metadata);
        return value;
    },
};

@Controller('/')
export class AppController {
    constructor(
        private readonly monolithicService: TemporaryMonolithicService,
    ) {}

    @HttpCode(HttpStatus.CREATED)
    @Put('/students')
    createStudent(@Ip() ip: string, @Res() res: Response) {
        console.log(ip);
        res.status(HttpStatus.CREATED).json({ id: 'abcde' });
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch('/student/:id')
    updateStudent(@Body(tb) body: any) {}
}
