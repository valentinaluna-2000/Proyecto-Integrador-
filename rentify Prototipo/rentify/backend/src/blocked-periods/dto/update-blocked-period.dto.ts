import { PartialType } from '@nestjs/swagger';
import { CreateBlockedPeriodDto } from './create-blocked-period.dto';

export class UpdateBlockedPeriodDto extends PartialType(CreateBlockedPeriodDto) {}
