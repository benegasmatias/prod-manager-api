import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalibrationsService } from './calibrations.service';
import { CalibrationsController } from './calibrations.controller';
import { Calibration } from './entities/calibration.entity';
import { BusinessesModule } from '../businesses/businesses.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Calibration]),
        BusinessesModule,
        UsersModule,
    ],
    controllers: [CalibrationsController],
    providers: [CalibrationsService],
    exports: [CalibrationsService],
})
export class CalibrationsModule {}
