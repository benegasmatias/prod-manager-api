
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from the root of the api
dotenv.config();

async function runAudit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Obtener todos los planes activos
        const plansRes = await client.query(`
            SELECT id, category, name, price, active 
            FROM subscription_plans 
            WHERE active = true
        `);
        const allPlans = plansRes.rows;

        // 2. Obtener rubros y estadísticas generales
        const statsRes = await client.query(`
            SELECT category, count(*) as total 
            FROM businesses 
            GROUP BY category
        `);
        const categoryStats = statsRes.rows;

        // 3. Obtener detalles de negocios en riesgo
        const businessesRes = await client.query(`
            SELECT id, name, category, plan_id as "currentPlanId", status, 
                   subscription_expires_at as "expiresAt", accepting_orders
            FROM businesses
            ORDER BY subscription_expires_at ASC
        `);
        const businesses = businessesRes.rows;

        const today = new Date();
        const globalFreePlan = allPlans.find(p => (p.category === null || p.category === undefined) && Number(p.price) === 0);

        const report = categoryStats.map(stat => {
            const cat = stat.category;
            const catPlans = allPlans.filter(p => p.category === cat);
            const freePlan = catPlans.find(p => Number(p.price) === 0) || globalFreePlan;
            
            const catBusinesses = businesses.filter(b => b.category === cat);
            
            const atRisk = catBusinesses.filter(b => {
                const isMechanic = cat === 'MECHANIC_WORKSHOP';
                const hasNoFreeFallback = !freePlan;
                const isExpiringSoon = b.expiresAt && (new Date(b.expiresAt).getTime() - today.getTime()) < (10 * 24 * 60 * 60 * 1000);
                const isAlreadyExpired = b.expiresAt && new Date(b.expiresAt) < today;
                
                return isMechanic || hasNoFreeFallback || isExpiringSoon || isAlreadyExpired;
            });

            return {
                category: cat,
                freePlanExists: !!freePlan,
                freePlanName: freePlan?.name || 'NINGUNO',
                activePlansCount: catPlans.length,
                activePlansList: catPlans.map(p => p.name).join(', '),
                totalBusinesses: Number(stat.total),
                atRiskCount: atRisk.length,
                atRiskDetails: atRisk.map(b => {
                    const days = b.expiresAt ? Math.ceil((new Date(b.expiresAt).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A';
                    let reason = '';
                    if (!freePlan) reason += '[SIN PLAN FREE] ';
                    if (days !== 'N/A' && (days as number) < 0) reason += '[VENCIDO] ';
                    else if (days !== 'N/A' && (days as number) <= 5) reason += '[VENCE PRONTO] ';
                    
                    return {
                        id: b.id.substring(0,8),
                        name: b.name,
                        plan: b.currentPlanId || 'S/P',
                        status: b.status,
                        expires: b.expiresAt ? new Date(b.expiresAt).toLocaleDateString() : 'PERMANENTE',
                        days,
                        reason: reason || 'Auditado'
                    };
                })
            };
        });

        console.log('=== RESULTADOS DE AUDITORÍA DE SUSCRIPCIONES ===');
        console.log(JSON.stringify(report, null, 2));

    } catch (err) {
        console.error('Error durante la auditoría:', err);
    } finally {
        await client.end();
    }
}

runAudit();
