"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Print3DOrderStrategy = void 0;
const enums_1 = require("../../common/enums");
const typeorm_1 = require("typeorm");
const material_entity_1 = require("../../materials/entities/material.entity");
const production_job_entity_1 = require("../../jobs/entities/production-job.entity");
const machine_entity_1 = require("../../machines/entities/machine.entity");
class Print3DOrderStrategy {
    getInitialStatus(items) {
        const needsDesign = items?.some(item => item.metadata?.seDiseñaSTL === true ||
            item.metadata?.seDiseñaSTL === 'true');
        return needsDesign ? enums_1.OrderStatus.DESIGN : enums_1.OrderStatus.PENDING;
    }
    getProductionStages(item, order) {
        return [];
    }
    async onAfterCreate(order, manager) {
    }
    async handleProductionFailure(order, dto, manager, userId) {
        const { materialId, wastedGrams, metadata } = dto;
        const materialRepo = manager.getRepository(material_entity_1.Material);
        if (metadata?.materials && Array.isArray(metadata.materials)) {
            for (const matSpec of metadata.materials) {
                const { materialId: matId, wastedGrams: wasted } = matSpec;
                if (!matId || !wasted)
                    continue;
                const material = await materialRepo.findOneBy({ id: matId });
                if (material) {
                    const newRemaining = Math.max(0, material.remainingWeightGrams - wasted);
                    await materialRepo.update(material.id, { remainingWeightGrams: newRemaining });
                }
            }
        }
        else if (materialId && wastedGrams > 0) {
            const material = await materialRepo.findOneBy({ id: materialId });
            if (material) {
                const newRemaining = Math.max(0, material.remainingWeightGrams - wastedGrams);
                await materialRepo.update(material.id, { remainingWeightGrams: newRemaining });
            }
        }
        return dto.moveToReprint ? enums_1.OrderStatus.REPRINT_PENDING : enums_1.OrderStatus.FAILED;
    }
    async releaseResources(order, manager, options) {
        const { itemId, targetStatus } = options;
        const jobRepo = manager.getRepository(production_job_entity_1.ProductionJob);
        const machineRepo = manager.getRepository(machine_entity_1.Machine);
        const where = { orderId: order.id };
        if (itemId)
            where.orderItemId = itemId;
        const activeJobs = await jobRepo.find({
            where: {
                ...where,
                status: (0, typeorm_1.In)([enums_1.JobStatus.QUEUED, enums_1.JobStatus.PRINTING, enums_1.JobStatus.PAUSED])
            }
        });
        for (const job of activeJobs) {
            if (job.machineId) {
                await machineRepo.update(job.machineId, { status: enums_1.MachineStatus.IDLE });
                console.log(`[Estrategia 3D] Impresora ${job.machineId} liberada.`);
            }
            await jobRepo.update(job.id, { status: targetStatus });
        }
    }
}
exports.Print3DOrderStrategy = Print3DOrderStrategy;
//# sourceMappingURL=print3d-order.strategy.js.map