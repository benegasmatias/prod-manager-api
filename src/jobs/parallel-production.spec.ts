import { isFeatureEnabled } from '../common/feature-flags';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductionJob } from './entities/production-job.entity';

describe('Parallel Production Integration', () => {
    describe('isFeatureEnabled', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv };
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it('should return false by default (disabled globally)', () => {
            process.env.ENABLE_PARALLEL_PRODUCTION = undefined;
            process.env.NODE_ENV = 'production';
            
            const result = isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION');
            expect(result).toBe(false);
        });

        it('should return true if ENABLE_PARALLEL_PRODUCTION env variable is "true"', () => {
            process.env.ENABLE_PARALLEL_PRODUCTION = 'true';
            const result = isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION');
            expect(result).toBe(true);
        });

        it('should return false if ENABLE_PARALLEL_PRODUCTION env variable is "false"', () => {
            process.env.ENABLE_PARALLEL_PRODUCTION = 'false';
            const result = isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION');
            expect(result).toBe(false);
        });

        it('should auto-enable only for IMPRESION_3D in development/testing environments', () => {
            process.env.ENABLE_PARALLEL_PRODUCTION = undefined;
            process.env.NODE_ENV = 'development';

            // IMPRESION_3D in dev should be enabled
            expect(isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION', { id: 'biz-1', category: 'IMPRESION_3D' })).toBe(true);
            
            // METALURGICA in dev should be disabled
            expect(isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION', { id: 'biz-2', category: 'METALURGICA' })).toBe(false);
            
            // CARPINTERIA in dev should be disabled
            expect(isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION', { id: 'biz-3', category: 'CARPINTERIA' })).toBe(false);
        });

        it('should support progressive rollout by business ID via environment variables', () => {
            process.env.ENABLE_PARALLEL_PRODUCTION = undefined;
            process.env.ENABLED_PARALLEL_PRODUCTION_BUSINESS_IDS = 'biz-custom-1,biz-custom-2';
            process.env.NODE_ENV = 'production'; // even in production!

            expect(isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION', { id: 'biz-custom-1', category: 'METALURGICA' })).toBe(true);
            expect(isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION', { id: 'biz-custom-3', category: 'METALURGICA' })).toBe(false);
        });

        it('should support explicit overrides via business capabilities or metadata', () => {
            process.env.ENABLE_PARALLEL_PRODUCTION = undefined;
            process.env.NODE_ENV = 'production';

            // Metadata override
            expect(isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION', { 
                id: 'biz-1', 
                category: 'METALURGICA',
                metadata: { enableParallelProduction: true }
            })).toBe(true);

            // Capabilities override
            expect(isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION', { 
                id: 'biz-2', 
                category: 'CARPINTERIA',
                capabilities: ['ENABLE_PARALLEL_PRODUCTION']
            })).toBe(true);

            // capabilitiesOverride override
            expect(isFeatureEnabled('ENABLE_PARALLEL_PRODUCTION', { 
                id: 'biz-3', 
                category: 'CARPINTERIA',
                capabilitiesOverride: { ENABLE_PARALLEL_PRODUCTION: true }
            })).toBe(true);
        });
    });

    describe('OrderItem Virtual Getter', () => {
        it('should return null if no production jobs are present', () => {
            const item = new OrderItem();
            item.productionJobs = [];

            expect(item.productionJob).toBeNull();
        });

        it('should return the first active job if multiple exist', () => {
            const item = new OrderItem();
            
            const jobDone = new ProductionJob();
            jobDone.id = 'job-1';
            jobDone.status = 'DONE' as any;

            const jobActive = new ProductionJob();
            jobActive.id = 'job-2';
            jobActive.status = 'IN_PROGRESS' as any;

            const jobQueued = new ProductionJob();
            jobQueued.id = 'job-3';
            jobQueued.status = 'QUEUED' as any;

            item.productionJobs = [jobDone, jobActive, jobQueued];

            // Should prefer active (IN_PROGRESS/QUEUED) over DONE
            expect(item.productionJob).toBe(jobActive);
        });

        it('should fall back to the first job if none are active', () => {
            const item = new OrderItem();
            
            const jobDone = new ProductionJob();
            jobDone.id = 'job-1';
            jobDone.status = 'DONE' as any;

            const jobFailed = new ProductionJob();
            jobFailed.id = 'job-2';
            jobFailed.status = 'FAILED' as any;

            item.productionJobs = [jobDone, jobFailed];

            expect(item.productionJob).toBe(jobDone);
        });
    });
});
