
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RetailProductsService } from './retail/services/retail-products.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productsService = app.get(RetailProductsService);

  const businessId = '00a38fac-a26a-4e02-8269-4fb8bf89a6d6'; // ID Real de tu negocio

  const products = [
    { name: 'Soporte Auriculares Gamer V2', category: 'Gaming', salePrice: 2500, costPrice: 800, barcode: 'G001', sku: 'TH-3D-001' },
    { name: 'Maceta Facetada Low Poly L', category: 'Deco', salePrice: 1800, costPrice: 450, barcode: 'D001', sku: 'TH-3D-002' },
    { name: 'Organizador de Cables Hexagonal', category: 'Oficina', salePrice: 1200, costPrice: 300, barcode: 'O001', sku: 'TH-3D-003' },
    { name: 'Articulado: Dragon de Fuego', category: 'Coleccionables', salePrice: 4500, costPrice: 1200, barcode: 'C001', sku: 'TH-3D-004' },
    { name: 'Lámpara de Noche Coral 3D', category: 'Iluminación', salePrice: 6500, costPrice: 2200, barcode: 'I001', sku: 'TH-3D-005' },
    { name: 'Engranaje Técnico Reforzado Z32', category: 'Repuestos', salePrice: 1500, costPrice: 500, barcode: 'R001', sku: 'TH-3D-006' },
    { name: 'Soporte Celular Minimalista', category: 'Gadgets', salePrice: 900, costPrice: 200, barcode: 'G002', sku: 'TH-3D-007' },
    { name: 'Busto Darth Vader 15cm', category: 'Coleccionables', salePrice: 3800, costPrice: 950, barcode: 'C002', sku: 'TH-3D-008' },
    { name: 'Kit Clips para Bolsas (x5)', category: 'Hogar', salePrice: 750, costPrice: 150, barcode: 'H001', sku: 'TH-3D-009' },
    { name: 'Soporte Control PS5 / Xbox', category: 'Gaming', salePrice: 1900, costPrice: 600, barcode: 'G003', sku: 'TH-3D-010' },
    { name: 'Lapicero "The Rock" Meme', category: 'Oficina', salePrice: 2200, costPrice: 700, barcode: 'O002', sku: 'TH-3D-011' },
    { name: 'Abridor de Botellas 3D Print', category: 'Hogar', salePrice: 1100, costPrice: 350, barcode: 'H002', sku: 'TH-3D-012' },
    { name: 'Protector Conector iPhone/USB-C', category: 'Gadgets', salePrice: 450, costPrice: 80, barcode: 'G004', sku: 'TH-3D-013' },
    { name: 'Portalápices Geométrico XL', category: 'Oficina', salePrice: 1600, costPrice: 400, barcode: 'O003', sku: 'TH-3D-014' },
    { name: 'Figura Pokeball Funcional', category: 'Coleccionables', salePrice: 2900, costPrice: 850, barcode: 'C003', sku: 'TH-3D-015' },
    { name: 'Soporte Laptop Ajustable (Par)', category: 'Oficina', salePrice: 3200, costPrice: 1100, barcode: 'O004', sku: 'TH-3D-016' },
    { name: 'Lámpara Luna Litofanía', category: 'Iluminación', salePrice: 5800, costPrice: 1800, barcode: 'I002', sku: 'TH-3D-017' },
    { name: 'Pieza Calibración Benchy Pro', category: 'Técnico', salePrice: 600, costPrice: 120, barcode: 'T001', sku: 'TH-3D-018' },
    { name: 'Organizador SD y Micro SD', category: 'Gadgets', salePrice: 850, costPrice: 180, barcode: 'G005', sku: 'TH-3D-019' },
    { name: 'Mate 3D con Polímero (Diseño)', category: 'Hogar', salePrice: 3500, costPrice: 1300, barcode: 'H003', sku: 'TH-3D-020' }
  ];

  console.log('🚀 Iniciando carga de 20 productos...');
  for (const p of products) {
    try {
      await productsService.create(businessId, p);
      console.log(`✅ Cargado: ${p.name}`);
    } catch (e) {
      console.error(`❌ Error en ${p.name}:`, e.message);
    }
  }

  console.log('🏁 Carga completa. ¡Disfruta tu catálogo!');
  await app.close();
}

bootstrap();
