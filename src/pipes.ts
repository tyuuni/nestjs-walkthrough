import {
    PipeTransform,
    Injectable,
    BadRequestException,
    NotAcceptableException,
    ArgumentMetadata,
    HttpStatus,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from './config';

export class RequestFormatValidationPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata) {
        if (metadata.metatype && value === undefined) {
            throw new BadRequestException({
                code: ErrorCode.BAD_REQUEST,
                message: 'invalid request',
            });
        }
        if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
            return value;
        }
        const object = plainToInstance(metadata.metatype, value);

        const errors = await validate(object);

        if (errors.length > 0) {
            const errorMessages = this.formatValidationErrors(errors);
            throw new NotAcceptableException({
                code: ErrorCode.INVALID_REQUEST_FORMAT,
                message: {
                    errors: errorMessages,
                },
            });
        }

        return object;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }

    private formatValidationErrors(errors: ValidationError[]): string[] {
        return errors
            .map((error) => {
                if (error.children && error.children.length > 0) {
                    return this.formatValidationErrors(error.children);
                }
                return Object.values(error.constraints || {});
            })
            .flat();
    }
}
