const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { ProductsService } = require('../dist/products/products.service');

async function run() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const productsService = app.get(ProductsService);
    
    const product = await productsService.findOne('4602cba8-0b53-4cf0-a836-a8ef7915a155');

    console.log('PRODUCT METADATA:', JSON.stringify(product.metadata, null, 2));
    console.log('PRODUCT ATTRIBUTES:', JSON.stringify(product.attributes, null, 2));

    await app.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
