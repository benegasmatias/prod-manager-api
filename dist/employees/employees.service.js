"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("./entities/employee.entity");
const supabase_service_1 = require("../common/supabase/supabase.service");
const businesses_service_1 = require("../businesses/businesses.service");
const users_service_1 = require("../users/users.service");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const plan_usage_service_1 = require("../businesses/plan-usage.service");
let EmployeesService = class EmployeesService {
    constructor(employeeRepository, supabaseService, businessesService, usersService, planUsageService, auditService) {
        this.employeeRepository = employeeRepository;
        this.supabaseService = supabaseService;
        this.businessesService = businessesService;
        this.usersService = usersService;
        this.planUsageService = planUsageService;
        this.auditService = auditService;
    }
    async findAll(businessId, active) {
        const where = { businessId };
        if (active !== undefined) {
            where.active = active;
        }
        return this.employeeRepository.find({
            where,
            order: { firstName: 'ASC' },
        });
    }
    async findOne(id, businessId) {
        const employee = await this.employeeRepository.findOneBy({ id, businessId });
        if (!employee) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        return employee;
    }
    async create(businessId, data) {
        await this.planUsageService.ensureEmployeeCreationAllowed(businessId);
        const { email, firstName, lastName, role } = data;
        const supabase = this.supabaseService.getClient();
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError)
            throw listError;
        let userFound = users.find(u => u.email === email);
        let userId;
        let mustChange = false;
        if (!userFound) {
            console.log(`[EmployeesService] Creando nuevo usuario en Supabase para ${email}`);
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password: '12345',
                email_confirm: true,
                user_metadata: { full_name: `${firstName} ${lastName || ''}`.trim() }
            });
            if (createError)
                throw createError;
            userId = newUser.user.id;
            mustChange = true;
        }
        else {
            console.log(`[EmployeesService] Usuario ya existe en Supabase: ${email}`);
            userId = userFound.id;
        }
        const localUser = await this.usersService.findOrCreate(userId, email, `${firstName} ${lastName || ''}`.trim());
        if (mustChange) {
            await this.usersService.update(userId, { mustChangePassword: true });
        }
        await this.businessesService.addMemberToBusiness(userId, businessId, role || 'MEMBER');
        const employee = this.employeeRepository.create({
            ...data,
            businessId,
        });
        const result = await this.employeeRepository.save(employee);
        const savedEmployee = Array.isArray(result) ? result[0] : result;
        await this.auditService.log(audit_log_entity_1.AuditAction.RESOURCE_CREATED, 'EMPLOYEE', savedEmployee.id, businessId, null, { email: savedEmployee.email, role: savedEmployee.role });
        return savedEmployee;
    }
    async update(id, businessId, data) {
        await this.findOne(id, businessId);
        await this.employeeRepository.update(id, data);
        return this.findOne(id, businessId);
    }
    async remove(id, businessId) {
        const employee = await this.findOne(id, businessId);
        employee.active = false;
        await this.employeeRepository.save(employee);
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        supabase_service_1.SupabaseService,
        businesses_service_1.BusinessesService,
        users_service_1.UsersService,
        plan_usage_service_1.PlanUsageService,
        audit_service_1.AuditService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map