import { BusinessStatus } from '../../common/enums';
export declare const BUSINESS_STATUSES_KEY = "businessStatuses";
export declare const AllowBusinessStatuses: (...statuses: BusinessStatus[]) => import("@nestjs/common").CustomDecorator<string>;
