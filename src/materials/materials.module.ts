import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { Material } from './entities/material.entity';
import { BusinessesModule } from '../businesses/businesses.module';


@Module({
    imports: [TypeOrmModule.forFeature([Material]), BusinessesModule],
    controllers: [MaterialsController],
    providers: [MaterialsService],
    exports: [MaterialsService],
})
export class MaterialsModule { }
