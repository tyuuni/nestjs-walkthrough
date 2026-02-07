export const APP_NAME = 'nestjs-walkthrough';
export const APP_VERSION = '1.0.0';

export enum AppSource {
    NEST_BACKEND = 1,
}

export enum ErrorCode {
    BAD_REQUEST = 40000001,

    INVALID_REQUEST_FORMAT = 40600001,

    LOGIN_FAILURE_NO_SUCH_USER = 40610001,
}
