import { IndustryStrategy, DashboardContext } from './industry-strategy.interface';
import { OrderStatus } from '../../common/enums';

export class Print3DIndustryStrategy implements IndustryStrategy {
  getOperationalCounters(context: DashboardContext) {
    return undefined;
  }

  getPipelineSummary(context: DashboardContext) {
    return undefined;
  }

  getCalendarEvents(context: DashboardContext) {
    return undefined;
  }
}
