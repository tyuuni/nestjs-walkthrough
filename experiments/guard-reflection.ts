import { Reflector } from '@nestjs/core';
import {
    Controller,
    Get,
    Post,
    Injectable,
    ExecutionContext,
    Module,
    UseGuards,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

enum Role {
    USER = 'user',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
}

export const Roles = Reflector.createDecorator<Role[]>();

@Injectable()
export class RolesGuard {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext) {
        const roles = this.reflector.getAllAndOverride(Roles, [
            context.getHandler(),
            context.getClass(),
        ]);
        console.log(roles);
        if (!roles || roles.length === 0) {
            return true;
        }
        return false;
    }
}

@Controller()
@UseGuards(RolesGuard)
class TestController {
    constructor() {}

    @Get('/hello')
    async hello() {
        return 'hello';
    }

    @Post('/create')
    @Roles([Role.ADMIN])
    async create() {}
}

@Module({
    controllers: [TestController],
    providers: [RolesGuard],
})
class TestModule {}

const run = async () => {
    const app = await NestFactory.create(TestModule);
    await app.listen(3000);
};

run();
