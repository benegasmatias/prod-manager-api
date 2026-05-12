
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const newPlans = [
    {
        id: 'taller-free',
        name: 'TALLER FREE',
        category: 'MECHANIC_WORKSHOP',
        price: 0,
        currency: 'ARS',
        description: 'Gestión básica para talleres individuales.',
        features: JSON.stringify(['Hasta 5 servicios / mes', '1 rampa / mecánico', 'Gestión de Clientes Básica']),
        sidebarItems: JSON.stringify(['/dashboard', '/pedidos', '/clientes', '/ajustes']),
        maxUsers: 1,
        maxOrdersPerMonth: 5,
        maxBusinesses: 1,
        maxMachines: 1,
        isRecommended: false,
        ctaText: 'Empezar ahora',
        ctaLink: '/register',
        sortOrder: 3,
        active: true,
        hasTrial: false,
        trialDays: 0
    },
    {
        id: 'metalurgica-free',
        name: 'METALÚRGICA FREE',
        category: 'METALURGICA',
        price: 0,
        currency: 'ARS',
        description: 'Gestión esencial para pequeños talleres de herrería.',
        features: JSON.stringify(['5 trabajos / mes', '1 puesto de trabajo', 'Gestión de materiales básica']),
        sidebarItems: JSON.stringify(['/dashboard', '/pedidos', '/materiales', '/ajustes']),
        maxUsers: 1,
        maxOrdersPerMonth: 5,
        maxBusinesses: 1,
        maxMachines: 1,
        isRecommended: false,
        ctaText: 'Empezar ahora',
        ctaLink: '/register',
        sortOrder: 7,
        active: true,
        hasTrial: false,
        trialDays: 0
    },
    {
        id: 'kiosco-free',
        name: 'KIOSCO FREE',
        category: 'KIOSCO',
        price: 0,
        currency: 'ARS',
        description: 'Control básico para kioscos pequeños.',
        features: JSON.stringify(['5 ventas / mes', 'Caja básica', '1 usuario']),
        sidebarItems: JSON.stringify(['/dashboard', '/pedidos', '/stock', '/ajustes']),
        maxUsers: 1,
        maxOrdersPerMonth: 5,
        maxBusinesses: 1,
        maxMachines: 0,
        isRecommended: false,
        ctaText: 'Empezar ahora',
        ctaLink: '/register',
        sortOrder: 10,
        active: true,
        hasTrial: false,
        trialDays: 0
    },
    {
        id: 'carpinteria-free',
        name: 'CARPINTERIA FREE',
        category: 'CARPINTERIA',
        price: 0,
        currency: 'ARS',
        description: 'Gestión esencial para carpinteros solitarios.',
        features: JSON.stringify(['5 trabajos / mes', '1 banco de trabajo', 'Caja básica']),
        sidebarItems: JSON.stringify(['/dashboard', '/pedidos', '/materiales', '/ajustes']),
        maxUsers: 1,
        maxOrdersPerMonth: 5,
        maxBusinesses: 1,
        maxMachines: 1,
        isRecommended: false,
        ctaText: 'Empezar ahora',
        ctaLink: '/register',
        sortOrder: 20,
        active: true,
        hasTrial: false,
        trialDays: 0
    }
];

async function seed() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        for (const plan of newPlans) {
            const exists = await client.query('SELECT id FROM subscription_plans WHERE id = $1', [plan.id]);
            if (exists.rows.length === 0) {
                await client.query(`
                    INSERT INTO subscription_plans 
                    (id, category, name, price, currency, description, features, "sidebarItems", 
                     "maxUsers", "maxOrdersPerMonth", "maxBusinesses", "maxMachines", 
                     "isRecommended", "ctaText", "ctaLink", "sortOrder", active, "hasTrial", "trialDays")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                `, [
                    plan.id, plan.category, plan.name, plan.price, plan.currency, plan.description, 
                    plan.features, plan.sidebarItems, plan.maxUsers, plan.maxOrdersPerMonth, 
                    plan.maxBusinesses, plan.maxMachines, plan.isRecommended, plan.ctaText, 
                    plan.ctaLink, plan.sortOrder, plan.active, plan.hasTrial, plan.trialDays
                ]);
                console.log(`Plan ${plan.id} created.`);
            } else {
                // Update to ensure consistency
                await client.query(`
                    UPDATE subscription_plans SET
                    category = $2, name = $3, price = $4, currency = $5, description = $6, 
                    features = $7, "sidebarItems" = $8, "maxUsers" = $9, "maxOrdersPerMonth" = $10, 
                    "maxBusinesses" = $11, "maxMachines" = $12, "isRecommended" = $13, 
                    "ctaText" = $14, "ctaLink" = $15, "sortOrder" = $16, active = $17, 
                    "hasTrial" = $18, "trialDays" = $19
                    WHERE id = $1
                `, [
                    plan.id, plan.category, plan.name, plan.price, plan.currency, plan.description, 
                    plan.features, plan.sidebarItems, plan.maxUsers, plan.maxOrdersPerMonth, 
                    plan.maxBusinesses, plan.maxMachines, plan.isRecommended, plan.ctaText, 
                    plan.ctaLink, plan.sortOrder, plan.active, plan.hasTrial, plan.trialDays
                ]);
                console.log(`Plan ${plan.id} updated for consistency.`);
            }
        }
    } catch (err) {
        console.error('Error seeding plans:', err);
    } finally {
        await client.end();
    }
}

seed();
