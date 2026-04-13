import { SetMetadata } from '@nestjs/common';

export const REQUIRE_CAPABILITY_KEY = 'require_capability';
export const RequireCapability = (capability: string) => SetMetadata(REQUIRE_CAPABILITY_KEY, capability);
