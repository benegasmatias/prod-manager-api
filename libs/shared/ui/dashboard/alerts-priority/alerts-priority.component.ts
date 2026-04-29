import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, AlertTriangle, AlertCircle, ArrowRight, ExternalLink, Search } from 'lucide-angular';
import { cn } from '@shared/utils/cn';

@Component({
  selector: 'app-alerts-priority-widget',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    @if (alerts().length > 0) {
      <div class="space-y-4">
        @for (alert of alerts(); track alert.message) {
          <div 
            [routerLink]="getRoute(alert)"
            [queryParams]="getQueryParams(alert)"
            [class]="cn(
              'p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-surface-container-lowest transition-all duration-700 relative group overflow-hidden shadow-2xl shadow-text/5',
              (alert.orderId || alert.searchQuery || alert.actionLink) ? 'cursor-pointer hover:shadow-primary/10 active:scale-[0.99]' : 'cursor-default'
            )"
          >
             <!-- EDITORIAL ACCENT BAR -->
             <div [class]="cn(
               'absolute left-0 top-0 bottom-0 w-2 sm:w-2.5 transition-all duration-700',
               alert.type === 'error' ? 'bg-danger shadow-[10px_0_30px_rgba(var(--danger-rgb),0.2)]' : 
               alert.type === 'critical' ? 'bg-primary shadow-[10px_0_30px_rgba(var(--primary-rgb),0.2)]' : 'bg-text-muted/10'
             )"></div>
 
             <div class="flex items-start gap-4 sm:gap-8">
                <div [class]="cn(
                  'h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 bg-surface-container-low',
                  alert.type === 'error' ? 'text-danger' : alert.type === 'critical' ? 'text-primary' : 'text-text-muted/20'
                )">
                  <lucide-angular [img]="alert.type === 'error' ? icons.AlertCircle : icons.AlertTriangle" class="h-5 w-5 sm:h-6 sm:w-6"></lucide-angular>
                </div>
                
                <div class="flex-1 space-y-4 sm:space-y-6">
                   <div class="space-y-2">
                      <p class="text-base sm:text-lg font-black tracking-tighter text-text leading-tight group-hover:text-primary transition-colors uppercase italic">{{ alert.message }}</p>
                      <div class="flex items-center gap-3">
                        <span class="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span class="text-[8px] sm:text-[9px] font-black text-text-muted/40 uppercase tracking-[0.4em]">{{ alert.timestamp }}</span>
                      </div>
                   </div>
                   
                   @if (alert.orderId || alert.searchQuery || alert.actionLink) {
                      <div class="flex items-center gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-text-muted/30 group-hover:text-primary transition-all group/btn">
                         <span>Explorar registro</span>
                         <div class="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-surface-container-low flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white transition-all duration-500">
                           <lucide-angular [img]="icons.ArrowRight" class="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform"></lucide-angular>
                         </div>
                      </div>
                    }
                </div>
             </div>
          </div>
        }
      </div>
    }
  `
})
export class AlertsPriorityWidgetComponent {
  alerts = input.required<any[]>();

  readonly icons = { AlertTriangle, AlertCircle, ArrowRight, ExternalLink, Search };

  getRoute(alert: any): any[] | null {
    if (alert.orderId) return ['/pedidos', alert.orderId];
    if (alert.actionLink) return [alert.actionLink];
    if (alert.searchQuery) return ['/pedidos'];
    return null;
  }

  getQueryParams(alert: any): any | null {
    if (alert.queryParams) return alert.queryParams;
    
    const params: any = {};
    if (alert.alertFilter) params.alertFilter = alert.alertFilter;
    if (alert.searchQuery) params.search = alert.searchQuery;

    return Object.keys(params).length > 0 ? params : null;
  }

  cn = cn;
}
