import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete, Request, BadRequestException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { BusinessStatus } from '../common/enums';

@Controller('customers')
@UseGuards(SupabaseAuthGuard)
export class CustomersController {
    constructor(
        private readonly customersService: CustomersService,
    ) { }

    @Post()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async create(@Request() req, @Body() createCustomerDto: CreateCustomerDto) {
        return this.customersService.create(createCustomerDto);
    }

    @Get()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
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
        return this.customersService.findAll(businessId, q, Number(page) || 1, Number(limit) || 10);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    @Patch(':id')
    async update(@Request() req, @Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
        // En un futuro estos también deberían usar los guards si el DTO no trae businessId
        return this.customersService.update(id, updateCustomerDto);
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id: string) {
        return this.customersService.remove(id);
    }
}
