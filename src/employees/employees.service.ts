import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
    ) { }

    async findAll(businessId: string, active?: boolean): Promise<Employee[]> {
        const where: any = { businessId };

        if (active !== undefined) {
            where.active = active;
        }

        return this.employeeRepository.find({
            where,
            order: { firstName: 'ASC' },
        });
    }

    async findOne(id: string, businessId: string): Promise<Employee> {
        const employee = await this.employeeRepository.findOneBy({ id, businessId });
        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }
        return employee;
    }

    async create(businessId: string, data: any): Promise<Employee> {
        const employee = this.employeeRepository.create({
            ...data,
            businessId,
        });
        const saved = await this.employeeRepository.save(employee);
        return (Array.isArray(saved) ? saved[0] : saved) as Employee;
    }

    async update(id: string, businessId: string, data: any): Promise<Employee> {
        await this.findOne(id, businessId);
        await this.employeeRepository.update(id, data);
        return this.findOne(id, businessId);
    }

    async remove(id: string, businessId: string): Promise<void> {
        const employee = await this.findOne(id, businessId);
        employee.active = false;
        await this.employeeRepository.save(employee);
    }
}
