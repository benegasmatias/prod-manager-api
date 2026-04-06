import { Injectable } from '@nestjs/common';
import { IndustryStrategy } from './industry-strategy.interface';
import { GenericIndustryStrategy } from './generic-industry.strategy';
import { MetalworkIndustryStrategy } from './metalwork-industry.strategy';
import { Print3DIndustryStrategy } from './print3d-industry.strategy';

@Injectable()
export class BusinessStrategyProvider {
  private readonly genericStrategy = new GenericIndustryStrategy();
  private readonly metalworkStrategy = new MetalworkIndustryStrategy();
  private readonly print3dStrategy = new Print3DIndustryStrategy();

  /**
   * Resuelve la estrategia adecuada basada en la categoría del negocio.
   */
  getStrategy(category: string): IndustryStrategy {
    const rawCategory = (category || 'GENERICO').toUpperCase().trim();

    // Mapeo determinístico por categoría exacta
    if (rawCategory === 'IMPRESION_3D') {
      return this.print3dStrategy;
    }

    if (rawCategory === 'METALURGICA') {
      return this.metalworkStrategy;
    }

    if (rawCategory === 'CARPINTERIA') {
      return this.metalworkStrategy;
    }

    // Por defecto, estrategia genérica
    return this.genericStrategy;
  }
}
