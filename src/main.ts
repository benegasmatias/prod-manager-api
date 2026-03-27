import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: '*', // Permitir todos los orígenes en desarrollo para facilitar pruebas móviles
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3030;
  await app.listen(port, '0.0.0.0'); // Escuchar en todas las interfaces para permitir acceso desde la red local/móvil
  console.log(`🚀 API running on: http://0.0.0.0:${port}`);
}
bootstrap();
