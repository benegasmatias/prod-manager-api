import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
    ) { }

    async create(createCustomerDto: CreateCustomerDto) {
        try {
            const customer = this.customerRepository.create(createCustomerDto);
            return await this.customerRepository.save(customer);
        } catch (error) {
            if (error.code === '23505') { // Postgres code for unique violation
                throw new ConflictException('Ya existe un cliente con ese email en este negocio');
            }
            throw error;
        }
    }

    async findAll(businessId: string, q?: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.customerRepository.createQueryBuilder('customer');

        queryBuilder
            .where('customer.businessId = :businessId', { businessId });

        if (q) {
            queryBuilder.andWhere('customer.name ILIKE :q', { q: `%${q}%` });
        }

        // CARGA ÚNICAMENTE EL CONTEO DE PEDIDOS, SIN TRAER TODOS LOS OBJETOS DE LA BASE
        // Esto optimiza drásticamente la transferencia de datos y RAM del servidor
        queryBuilder.loadRelationCountAndMap('customer.totalOrders', 'customer.orders');

        const [items, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy('customer.createdAt', 'DESC')
            .getManyAndCount();

        // MAPEAMOS ESTRICTAMENTE AL DTO PARA ENVIAR SOLO LO NECESARIO
        const mappedItems = items.map(customer => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            notes: customer.notes,
            createdAt: customer.createdAt,
            totalOrders: (customer as any).totalOrders || 0
        }));

        return {
            items: mappedItems,
            total,
            page,
            limit,
        };
    }

    async findOne(id: string) {
        const customer = await this.customerRepository.findOne({
            where: { id },
        });
        if (!customer) throw new NotFoundException('Cliente no encontrado');
        return customer;
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto) {
        await this.findOne(id);
        await this.customerRepository.update(id, updateCustomerDto);
        return this.findOne(id);
    }

    async remove(id: string) {
        const customer = await this.findOne(id);
        await this.customerRepository.remove(customer);
        return { success: true };
    }
}
