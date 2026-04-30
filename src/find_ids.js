
const { DataSource } = require('typeorm');

async function findIds() {
    const ds = new DataSource({
        type: 'postgres',
        url: 'postgresql://postgres.jrcdlzqbadyueodqpsii:lb0FL2GbQTgvpEqt@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
        synchronize: false,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await ds.initialize();
        const user = await ds.query("SELECT id, \"defaultBusinessId\" FROM users WHERE email = 'benegas.matias21@gmail.com'");
        if (!user.length) {
            console.log('User not found');
            return;
        }
        
        const businessId = user[0].defaultBusinessId;
        const customers = await ds.query("SELECT id, name FROM customers WHERE \"businessId\" = $1 LIMIT 1", [businessId]);
        
        console.log(JSON.stringify({
            userId: user[0].id,
            businessId,
            customerId: customers.length ? customers[0].id : null,
            customerName: customers.length ? customers[0].name : 'Cliente General'
        }, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await ds.destroy();
    }
}

findIds();
