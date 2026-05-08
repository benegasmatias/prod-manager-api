import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductCategory } from '../../products/entities/product-category.entity';
import { CatalogOrderRequest } from '../entities/catalog-order-request.entity';
import { CatalogOrderRequestItem } from '../entities/catalog-order-request-item.entity';
import { CreateCatalogOrderRequestDto } from '../dto/create-catalog-order-request.dto';
import { ProductVisibility, ProductStatus, CatalogRequestStatus } from '../../common/enums';

@Injectable()
export class PublicCatalogService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(CatalogOrderRequest)
    private readonly requestRepository: Repository<CatalogOrderRequest>,
    private readonly dataSource: DataSource,
  ) {}

  async getCatalogData(slug: string) {
    const business = await this.businessRepository.findOne({
      where: { slug, isEnabled: true },
    });

    if (!business) {
      throw new NotFoundException('Establecimiento no encontrado o no disponible');
    }

    const categories = await this.categoryRepository.find({
      where: { businessId: business.id },
      order: { sortOrder: 'ASC' },
    });

    const products = await this.productRepository.find({
      where: {
        businessId: business.id,
        visibility: ProductVisibility.PUBLIC,
        status: ProductStatus.ACTIVE,
      },
      relations: ['category', 'productFiles', 'productFiles.fileAsset'],
      order: { name: 'ASC' },
    });

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        category: business.category,
        metadata: business.metadata,
      },
      categories,
      products,
    };
  }

  async createRequest(slug: string, dto: CreateCatalogOrderRequestDto) {
    const business = await this.businessRepository.findOneBy({ slug, isEnabled: true });
    if (!business) throw new NotFoundException('Negocio no disponible');

    return await this.dataSource.transaction(async (manager) => {
      let total = 0;
      const requestItems: CatalogOrderRequestItem[] = [];

      for (const itemDto of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId, businessId: business.id },
        });

        if (!product) {
          throw new BadRequestException(`Producto ${itemDto.productId} no encontrado`);
        }

        const subtotal = Number(product.basePrice) * itemDto.quantity;
        total += subtotal;

        const requestItem = manager.create(CatalogOrderRequestItem, {
          productId: product.id,
          productNameSnapshot: product.name,
          unitPriceSnapshot: product.basePrice,
          quantity: itemDto.quantity,
          subtotalSnapshot: subtotal,
          notes: itemDto.notes,
        });

        requestItems.push(requestItem);
      }

      const request = manager.create(CatalogOrderRequest, {
        businessId: business.id,
        status: CatalogRequestStatus.REQUESTED,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        notes: dto.notes,
        deliveryMethod: dto.deliveryMethod,
        address: dto.address,
        totalSnapshot: total,
        items: requestItems,
      });

      return await manager.save(CatalogOrderRequest, request);
    });
  }
}
