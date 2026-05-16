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
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationTargetType } from '../../notifications/entities/notification.entity';

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
    private readonly notificationsService: NotificationsService,
  ) {}

  async getCatalogData(slug: string, query?: { page?: number; limit?: number; categoryId?: string; search?: string }) {
    console.log(`[PublicCatalogService] Fetching catalog for slug: "${slug}"`, query);
    const business = await this.businessRepository.findOne({
      where: { slug, isEnabled: true },
    });

    if (!business) {
      console.warn(`[PublicCatalogService] Business NOT FOUND for slug: "${slug}"`);
      throw new NotFoundException('Establecimiento no encontrado o no disponible');
    }
    
    console.log(`[PublicCatalogService] Business found: "${business.name}" (ID: ${business.id})`);

    const categories = await this.categoryRepository.find({
      where: { businessId: business.id },
      order: { sortOrder: 'ASC' },
    });

    // Build product query
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 12;
    const skip = (page - 1) * limit;

    const productQuery = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.productFiles', 'productFiles')
      .leftJoinAndSelect('productFiles.fileAsset', 'fileAsset')
      .where('product.businessId = :businessId', { businessId: business.id })
      .andWhere('product.visibility = :visibility', { visibility: ProductVisibility.PUBLIC })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE });

    if (query?.categoryId) {
      productQuery.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query?.search) {
      productQuery.andWhere('(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)', { 
        search: `%${query.search.toLowerCase()}%` 
      });
    }

    const products = await productQuery
      .orderBy('product.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getMany();

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

      const savedRequest = await manager.save(CatalogOrderRequest, request);

      // Notificar a los administradores del negocio
      try {
        await this.notificationsService.create({
          businessId: business.id,
          title: 'Nueva solicitud de catálogo',
          message: `El cliente ${dto.customerName} ha generado una nueva solicitud por un total de $${total}.`,
          type: NotificationType.INFO,
          targetType: NotificationTargetType.BUSINESS,
          actionUrl: '/catalogo/solicitudes',
          actionLabel: 'Ver solicitudes'
        });
      } catch (error) {
        console.error('[PublicCatalogService] Error sending notification:', error);
      }

      return savedRequest;
    });
  }
}
