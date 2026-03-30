import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessesService } from '../businesses/businesses.service';

@Controller('customers')
@UseGuards(SupabaseAuthGuard)
export class CustomersController {
    constructor(
        private readonly customersService: CustomersService,
        private readonly businessesService: BusinessesService,
    ) { }

    @Post()
    async create(@Request() req, @Body() createCustomerDto: CreateCustomerDto) {
        const hasAccess = await this.businessesService.checkAccess(req.user.id, createCustomerDto.businessId);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso a este negocio');
        }
        return this.customersService.create(createCustomerDto);
    }

    @Get()
    async findAll(
        @Request() req,
        @Query('businessId') businessId: string,
        @Query('q') q?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        if (!businessId) {
            throw new BadRequestException('El ID del negocio es obligatorio');
        }
        const hasAccess = await this.businessesService.checkAccess(req.user.id, businessId);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso a este negocio');
        }
        return this.customersService.findAll(businessId, q, Number(page) || 1, Number(limit) || 10);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    @Patch(':id')
    async update(@Request() req, @Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
        const customer = await this.customersService.findOne(id);
        const hasAccess = await this.businessesService.checkAccess(req.user.id, customer.businessId);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso a este negocio');
        }
        return this.customersService.update(id, updateCustomerDto);
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id: string) {
        const customer = await this.customersService.findOne(id);
        const hasAccess = await this.businessesService.checkAccess(req.user.id, customer.businessId);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso a este negocio');
        }
        return this.customersService.remove(id);
    }
}
