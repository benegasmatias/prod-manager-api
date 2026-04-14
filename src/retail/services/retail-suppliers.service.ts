import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from '../dto/supplier.dto';

@Injectable()
export class RetailSuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  async create(businessId: string, dto: CreateSupplierDto): Promise<Supplier> {
    // Check duplicate name
    const existing = await this.supplierRepo.findOne({
      where: { businessId, name: ILike(dto.name) }
    });
    if (existing) {
      throw new BadRequestException(`Ya existe un proveedor con el nombre: ${dto.name}`);
    }

    const supplier = this.supplierRepo.create({
      ...dto,
      businessId,
    });
    return this.supplierRepo.save(supplier);
  }

  async findAll(businessId: string): Promise<Supplier[]> {
    return this.supplierRepo.find({
      where: { businessId },
      order: { name: 'ASC' }
    });
  }

  async findOne(businessId: string, id: string): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({
      where: { businessId, id }
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async update(businessId: string, id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(businessId, id);
    
    if (dto.name) {
        const existing = await this.supplierRepo.findOne({
            where: { businessId, name: ILike(dto.name) }
        });
        if (existing && existing.id !== id) {
            throw new BadRequestException(`Ya existe otro proveedor con el nombre: ${dto.name}`);
        }
    }

    Object.assign(supplier, dto);
    return this.supplierRepo.save(supplier);
  }

  async deactivate(businessId: string, id: string): Promise<Supplier> {
    const supplier = await this.findOne(businessId, id);
    supplier.active = false;
    return this.supplierRepo.save(supplier);
  }
}
