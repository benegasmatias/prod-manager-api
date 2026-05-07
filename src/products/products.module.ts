import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { CatalogSeedService } from './catalog-seed.service';
import { ProductsController } from './products.controller';
import { FilesController } from './files.controller';
import { BusinessesModule } from '../businesses/businesses.module';
import { Product } from './entities/product.entity';
import { FileAsset } from './entities/file-asset.entity';
import { ProductFile } from './entities/product-file.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductVariant } from './entities/product-variant.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, FileAsset, ProductFile, ProductCategory, ProductVariant]),
        BusinessesModule
    ],
    controllers: [ProductsController, FilesController],
    providers: [ProductsService, CatalogSeedService],
    exports: [ProductsService, CatalogSeedService],
})
export class ProductsModule { }
