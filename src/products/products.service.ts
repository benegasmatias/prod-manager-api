import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Raw, Brackets } from 'typeorm';
import { Product } from './entities/product.entity';
import { FileAsset } from './entities/file-asset.entity';
import { ProductFile } from './entities/product-file.entity';
import { CreateProductDto, UpdateProductDto, FindProductsDto } from './dto/product.dto';
import { CreateFileAssetDto, ProductFileDto } from './dto/file.dto';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from './dto/category.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(FileAsset)
        private readonly fileAssetRepository: Repository<FileAsset>,
        @InjectRepository(ProductFile)
        private readonly productFileRepository: Repository<ProductFile>,
        @InjectRepository(ProductCategory)
        private readonly categoryRepository: Repository<ProductCategory>,
    ) { }

    // --- Product Methods ---

    async create(createProductDto: CreateProductDto) {
        const product = this.productRepository.create(createProductDto);
        return this.productRepository.save(product);
    }

    async findAll(query: FindProductsDto) {
        const { businessId, categoryId, status, fulfillmentMode, search, page = 1, limit = 50 } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .where('product.businessId = :businessId', { businessId });

        if (categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
        }
        if (status) {
            queryBuilder.andWhere('product.status = :status', { status });
        }
        if (fulfillmentMode) {
            queryBuilder.andWhere('product.fulfillmentMode = :fulfillmentMode', { fulfillmentMode });
        }

        if (search) {
            const searchTerm = `%${search.trim()}%`;
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where('product.name ILIKE :searchTerm', { searchTerm })
                      .orWhere('product.description ILIKE :searchTerm', { searchTerm })
                      .orWhere('category.name ILIKE :searchTerm', { searchTerm })
                      .orWhere("product.attributes->>'sku' ILIKE :searchTerm", { searchTerm });
                })
            );
        }

        const [items, total] = await queryBuilder
            .orderBy('product.name', 'ASC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return { items, total, page, limit };
    }

    async findOne(id: string) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['category', 'productFiles', 'productFiles.fileAsset'],
        });
        if (!product) throw new NotFoundException('Producto no encontrado');
        return product;
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        await this.findOne(id);
        await this.productRepository.update(id, updateProductDto);
        return this.findOne(id);
    }

    async remove(id: string) {
        const product = await this.findOne(id);
        return this.productRepository.remove(product);
    }

    // --- Category Methods ---

    async createCategory(dto: CreateProductCategoryDto) {
        const category = this.categoryRepository.create(dto);
        return this.categoryRepository.save(category);
    }

    async findAllCategories(businessId: string) {
        return this.categoryRepository.find({
            where: { businessId },
            order: { sortOrder: 'ASC', name: 'ASC' }
        });
    }

    async updateCategory(id: string, dto: UpdateProductCategoryDto) {
        await this.categoryRepository.update(id, dto);
        return this.categoryRepository.findOne({ where: { id } });
    }

    async removeCategory(id: string) {
        return this.categoryRepository.delete(id);
    }

    // --- File/Asset Methods ---

    async createFileAsset(createFileAssetDto: CreateFileAssetDto) {
        const asset = this.fileAssetRepository.create(createFileAssetDto);
        return this.fileAssetRepository.save(asset);
    }

    async addFileToProduct(productId: string, productFileDto: ProductFileDto) {
        await this.findOne(productId);
        const productFile = this.productFileRepository.create({
            productId,
            fileAssetId: productFileDto.fileAssetId,
            role: productFileDto.role,
        });
        return this.productFileRepository.save(productFile);
    }
}
