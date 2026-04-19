
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrdersService } from './orders/orders.service';
import { OrderType, OrderStatus } from './common/enums';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ordersService = app.get(OrdersService);

  const businessId = 'cdf7b24c-1c47-4003-bc87-a41b0332f325';

  const ordersData = [
    {
      businessId,
      clientName: 'Matias Test Gamer',
      priority: 3,
      notes: 'Pedido de prueba para testear multi-items',
      items: [
        { name: 'Soporte Auriculares Pro', qty: 2, weightGrams: 150, price: 1500, estimatedMinutes: 120 },
        { name: 'Organizador Cables Hexa', qty: 5, weightGrams: 20, price: 400, estimatedMinutes: 30 },
        { name: 'Stand Celular Minimal', qty: 1, weightGrams: 45, price: 800, estimatedMinutes: 45 },
      ]
    },
    {
      businessId,
      clientName: 'Ingenieria Avanzada S.A.',
      priority: 5,
      notes: 'Piezas tecnicas de alta precision',
      items: [
        { name: 'Engranaje Helicoidal Z24', qty: 4, weightGrams: 85, price: 2500, estimatedMinutes: 180 },
        { name: 'Acople Flexible V3', qty: 2, weightGrams: 35, price: 1200, estimatedMinutes: 90 },
      ]
    },
    {
      businessId,
      clientName: 'Deco House',
      priority: 2,
      notes: 'Estetica y diseño',
      items: [
        { name: 'Maceta Facetada L', qty: 3, weightGrams: 110, price: 1800, estimatedMinutes: 240 },
        { name: 'Lampara Coral 3D', qty: 1, weightGrams: 420, price: 5500, estimatedMinutes: 600 },
      ]
    }
  ];

  console.log('🌱 Seeding test orders...');
  for (const data of ordersData) {
    try {
      const order = await ordersService.create(data as any);
      console.log(`✅ Created order: ${order.code} for ${order.clientName}`);
    } catch (error) {
      console.error(`❌ Failed to create order: ${data.clientName}`, error);
    }
  }

  await app.close();
  console.log('🏁 Seeding complete.');
}

bootstrap();
