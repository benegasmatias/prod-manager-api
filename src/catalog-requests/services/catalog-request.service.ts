import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CatalogOrderRequest } from '../entities/catalog-order-request.entity';
import { CatalogOrderRequestItem } from '../entities/catalog-order-request-item.entity';
import { CatalogRequestStatus, OrderType } from '../../common/enums';
import { OrdersService } from '../../orders/orders.service';
import { Customer } from '../../customers/entities/customer.entity';

@Injectable()
export class CatalogRequestService {
  constructor(
    @InjectRepository(CatalogOrderRequest)
    private readonly requestRepository: Repository<CatalogOrderRequest>,
    @InjectRepository(CatalogOrderRequestItem)
    private readonly itemRepository: Repository<CatalogOrderRequestItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly ordersService: OrdersService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(businessId: string) {
    return this.requestRepository.find({
      where: { businessId },
      relations: [
        'items',
        'items.product',
        'items.product.productFiles',
        'items.product.productFiles.fileAsset'
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, businessId: string) {
    const request = await this.requestRepository.findOne({
      where: { id, businessId },
      relations: [
        'items',
        'items.product',
        'items.product.productFiles',
        'items.product.productFiles.fileAsset'
      ],
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    
    console.log(`[CatalogRequestService] findOne(${id}) items:`, request.items.length);
    request.items.forEach(item => {
      console.log(` - Item: ${item.productNameSnapshot}, Product populated: ${!!item.product}, ExtURL: ${item.product?.externalUrl}`);
    });

    return request;
  }

  async updateStatus(id: string, businessId: string, status: CatalogRequestStatus) {
    const request = await this.findOne(id, businessId);
    request.status = status;
    return this.requestRepository.save(request);
  }

  async convertToOrder(id: string, businessId: string, userId: string) {
    const request = await this.findOne(id, businessId);

    if (request.status === CatalogRequestStatus.CONVERTED_TO_ORDER) {
      throw new BadRequestException('Esta solicitud ya fue convertida en pedido');
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Encontrar o Crear Cliente
      let customer = await manager.findOne(Customer, {
        where: [
          { phone: request.customerPhone, businessId },
          ...(request.customerEmail ? [{ email: request.customerEmail, businessId }] : []),
        ],
      });

      if (!customer) {
        customer = manager.create(Customer, {
          businessId,
          name: request.customerName,
          phone: request.customerPhone,
          email: request.customerEmail,
        });
        customer = await manager.save(Customer, customer);
      }

      // 2. Preparar datos del pedido
      const orderDto: any = {
        businessId,
        customerId: customer.id,
        clientName: customer.name,
        type: OrderType.CLIENT,
        notes: `Solicitud de catálogo web: ${request.id}\nNotas del cliente: ${request.notes || 'Sin notas'}`,
        totalPrice: Number(request.totalSnapshot),
        siteInfo: request.address ? { address: request.address } : null,
        items: request.items.map((item) => ({
          productId: item.productId,
          name: item.productNameSnapshot,
          price: Number(item.unitPriceSnapshot),
          qty: item.quantity,
          subtotal: Number(item.subtotalSnapshot),
          notes: item.notes,
        })),
      };

      // 3. Crear el pedido usando OrdersService
      // Nota: Necesitamos pasar el manager si OrdersService lo soporta, o llamar directamente.
      // Como OrdersService.create usa su propio manager interno, llamaremos a la lógica de creación.
      const order = await this.ordersService.create(orderDto, { 
        userAgent: 'CONVERSION_CATALOG',
        manager 
      });

      // 4. Actualizar la solicitud
      request.status = CatalogRequestStatus.CONVERTED_TO_ORDER;
      request.orderId = order.id;
      await manager.save(CatalogOrderRequest, request);

      return { orderId: order.id, status: 'SUCCESS' };
    });
  }
}
