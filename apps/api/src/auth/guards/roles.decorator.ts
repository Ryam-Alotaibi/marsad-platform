import { SetMetadata } from '@nestjs/common';
import type { RoleKey } from '@marsad/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleKey[]) => SetMetadata(ROLES_KEY, roles);
