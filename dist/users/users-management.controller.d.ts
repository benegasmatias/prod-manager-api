import { UsersService } from './users.service';
import { UpdateDefaultBusinessDto } from './dto/update-default-business.dto';
export declare class UsersManagementController {
    private readonly usersService;
    constructor(usersService: UsersService);
    updateDefaultBusiness(req: any, dto: UpdateDefaultBusinessDto): Promise<import("./entities/user.entity").User>;
}
