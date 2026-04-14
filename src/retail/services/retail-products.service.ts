import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetailProduct } from '../entities/retail-product.entity';
import { CreateRetailProductDto, UpdateRetailProductDto } from '../dto/product.dto';

@Injectable()
export class RetailProductsService {
  constructor(
    @InjectRepository(RetailProduct)
    private readonly productRepository: Repository<RetailProduct>,
  ) {}

  async create(businessId: string, dto: CreateRetailProductDto): Promise<RetailProduct> {
    const product = this.productRepository.create({
      ...dto,
      businessId,
      stock: 0, // El stock inicial debe venir via movimiento posterior
    });
    return this.productRepository.save(product);
  }

  async findAll(businessId: string): Promise<RetailProduct[]> {
    return this.productRepository.find({
      where: { businessId, active: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(businessId: string, id: string): Promise<RetailProduct> {
    const product = await this.productRepository.findOne({
      where: { id, businessId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(businessId: string, id: string, dto: UpdateRetailProductDto): Promise<RetailProduct> {
    await this.findOne(businessId, id);
    await this.productRepository.update(id, dto);
    return this.findOne(businessId, id);
  }
}
