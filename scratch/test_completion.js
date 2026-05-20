"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const production_job_service_1 = require("../src/jobs/production-job.service");
const enums_1 = require("../src/common/enums");
async function bootstrap() {
    console.log("Bootstrapping NestJS application context...");
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    console.log("App context initialized.");
    const service = app.get(production_job_service_1.ProductionJobService);
    const jobId = 'a8511cd0-5340-4625-9ee1-2587cbfca576';
    const businessId = '00a38fac-a26a-4e02-8269-4fb8bf89a6d6';
    console.log(`Transitioning active job ${jobId} to DONE...`);
    const result = await service.updateStatus(businessId, jobId, enums_1.ProductionJobStatus.DONE);
    console.log("Job status updated. Result status:", result.status);
    await app.close();
    console.log("Done.");
}
bootstrap().catch(err => {
    console.error("Error during execution:", err);
    process.exit(1);
});
//# sourceMappingURL=test_completion.js.map