const { AppDataSource } = require('../dist/db/data-source');
const { Product } = require('../dist/products/entities/product.entity');

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('Connected via TypeORM');
    const repo = AppDataSource.getRepository(Product);
    const product = await repo.findOne({ where: { id: '4602cba8-0b53-4cf0-a836-a8ef7915a155' } });
    console.log('TypeORM Product:', JSON.stringify(product, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
