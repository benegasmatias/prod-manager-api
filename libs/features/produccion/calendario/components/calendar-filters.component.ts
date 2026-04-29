import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Filter, X, ChevronDown, User, Cpu, AlertCircle, Sparkles, RefreshCw, Settings2 } from 'lucide-angular';
import { CalendarFilters } from '../models/calendar.models';
import { Employee } from '@shared/models';

export type FilterLayout = 'VERTICAL' | 'HORIZONTAL';

@Component({
  selector: 'app-calendar-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div [class]="cn(
      'transition-all duration-1000',
      layout() === 'VERTICAL' ? 'bg-surface-container-low/30 backdrop-blur-3xl rounded-[3.5rem] p-10 border border-border/5 shadow-2xl shadow-text/5' : 'w-full flex flex-col gap-6 lg:gap-8'
    )">
      
      <!-- HORIZONTAL MODE: Better spacing and no cutting -->
      @if (layout() === 'HORIZONTAL') {
        <div class="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
          
          <!-- Pill Style Status Bar: Improved Scroll on mobile -->
          <div class="flex-1 flex flex-nowrap items-center gap-2 bg-surface rounded-full p-1.5 md:p-2 border border-border/5 shadow-2xl shadow-text/5 overflow-x-auto no-scrollbar lg:flex-wrap">
            <button 
              (click)="resetFilters()"
              [class]="cn(
                'px-5 md:px-8 py-2 md:py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all duration-500 whitespace-nowrap italic shrink-0',
                isReset() ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-105' : 'text-text-muted/30 hover:text-text'
              )">
              Todos los Pedidos
            </button>
            
            @for (status of statusOptions(); track status.key) {
              <button 
                (click)="toggleStatus(status.key)"
                [class]="cn(
                  'px-5 md:px-8 py-2 md:py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all duration-500 whitespace-nowrap italic shrink-0',
                  isStatusSelected(status.key) ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-105' : 'text-text-muted/30 hover:text-text'
                )">
                {{ status.label }}
              </button>
            }
          </div>
 
          <!-- Secondary Actions (Dropdown & More) -->
          <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 shrink-0">
             <!-- Collaborator Dropdown -->
             <div class="relative group w-full md:min-w-[240px]">
                <div class="absolute inset-y-0 left-5 md:left-6 flex items-center pointer-events-none">
                   <lucide-angular [img]="icons.User" class="h-3.5 w-3.5 md:h-4 md:w-4 text-text-muted/20 group-focus-within:text-primary transition-colors"></lucide-angular>
                </div>
                <select 
                  [(ngModel)]="operatorId"
                  (change)="onFilterChange()"
                  class="w-full appearance-none h-11 md:h-14 pl-12 md:pl-14 pr-10 md:pr-12 bg-surface rounded-xl md:rounded-2xl border border-border/5 text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-text focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer shadow-2xl shadow-text/5 italic">
                  <option value="all">Sinergia: Global</option>
                  @for (emp of employees(); track emp.id) {
                    <option [value]="emp.id">{{ emp.firstName }} {{ emp.lastName }}</option>
                  }
                </select>
                <lucide-angular [img]="icons.ChevronDown" class="absolute right-5 md:right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/20 pointer-events-none group-hover:text-primary transition-colors"></lucide-angular>
             </div>
 
             <!-- Settings/Adjustments Icon -->
             <button 
               (click)="showAdvanced.set(!showAdvanced())"
               [class]="cn(
                 'h-11 md:h-14 w-full md:w-14 flex items-center justify-center rounded-xl md:rounded-2xl transition-all shadow-2xl shadow-text/5 group border',
                 showAdvanced() ? 'bg-primary border-primary text-white scale-110 shadow-primary/30' : 'bg-surface border-border/5 text-text-muted/40 hover:text-primary hover:scale-110'
               )">
                <lucide-angular [img]="icons.Settings2" class="h-4 w-4 md:h-5 md:w-5 group-hover:rotate-45 transition-transform duration-700"></lucide-angular>
             </button>
          </div>
 
        </div>
 
        <!-- ADVANCED FILTERS ROW: Dynamic Reveal -->
        <div *ngIf="showAdvanced()" class="flex flex-wrap items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-500 pt-4 border-t border-border/5 mt-4">
           <button (click)="toggleRisky()" 
                   [class]="cn(
                     'px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border transition-all italic flex items-center gap-2',
                     filters().onlyRisky ? 'bg-accent border-accent text-white shadow-2xl shadow-accent/40 scale-105' : 'bg-surface border-border/5 text-text-muted/40'
                   )">
              <lucide-angular [img]="icons.AlertCircle" class="h-3 w-3"></lucide-angular>
              En Riesgo
           </button>
           <button (click)="toggleOverdue()" 
                   [class]="cn(
                     'px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border transition-all italic flex items-center gap-2',
                     filters().onlyOverdue ? 'bg-text border-text text-surface shadow-2xl shadow-text/40 scale-105' : 'bg-surface border-border/5 text-text-muted/40'
                   )">
              <lucide-angular [img]="icons.Cpu" class="h-3 w-3"></lucide-angular>
              Vencidos
           </button>
 
           <div class="h-4 w-px bg-border/10 mx-2 hidden sm:block"></div>
           
           <span class="text-[8px] font-black uppercase tracking-[0.4em] text-text-muted/20 italic">Filtros Avanzados</span>
        </div>
      }
 
      <!-- VERTICAL MODE: Original Layout -->
      @if (layout() === 'VERTICAL') {
        <div class="flex items-center justify-between mb-10">
          <div class="flex items-center gap-4">
            <div class="h-14 w-14 rounded-2xl bg-surface border border-border/5 flex items-center justify-center text-primary shadow-2xl shadow-text/5">
              <lucide-angular [img]="icons.Filter" class="h-6 w-6"></lucide-angular>
            </div>
            <div class="flex flex-col">
               <h3 class="text-xs font-black uppercase tracking-[0.4em] text-text italic">Refinar Parámetros</h3>
               <p class="text-[9px] font-black uppercase tracking-widest text-text-muted/20 italic">Segmentación de Carga</p>
            </div>
          </div>
          <button (click)="resetFilters()" class="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted/30 hover:text-primary transition-all italic">Resetear</button>
        </div>
 
        <div class="space-y-12">
          <div class="flex flex-wrap gap-4">
             <button (click)="toggleRisky()" 
                     [class]="'px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border transition-all italic ' + 
                     (filters().onlyRisky ? 'bg-accent border-accent text-white shadow-2xl shadow-accent/40' : 'bg-surface border-border/5 text-text-muted/40')">
                En Riesgo
             </button>
             <button (click)="toggleOverdue()" 
                     [class]="'px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border transition-all italic ' + 
                     (filters().onlyOverdue ? 'bg-text border-text text-surface shadow-2xl shadow-text/40' : 'bg-surface border-border/5 text-text-muted/40')">
                Vencidos
             </button>
          </div>
 
          <div class="space-y-6">
            <label class="text-[9px] font-black uppercase tracking-[0.5em] text-text-muted/20 ml-4 italic">Etapas Operativas</label>
            <div class="grid grid-cols-1 gap-3">
              @for (status of statusOptions(); track status.key) {
                <label 
                  [class]="'flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-500 cursor-pointer select-none ' + 
                  (isStatusSelected(status.key) ? 'bg-primary/5 border-primary/20 scale-[1.02]' : 'bg-surface border-border/5 opacity-60 hover:opacity-100')">
                  <input type="checkbox" [checked]="isStatusSelected(status.key)" (change)="toggleStatus(status.key)" class="rounded h-4 w-4 accent-primary" />
                  <span class="text-[10px] font-black text-text uppercase tracking-widest italic grow">{{ status.label }}</span>
                  <div *ngIf="isStatusSelected(status.key)" class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                </label>
              }
            </div>
          </div>
        </div>
      }
 
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class CalendarFiltersComponent {
  employees = input.required<Employee[]>();
  statusOptions = input.required<{ key: string; label: string }[]>();
  layout = input<FilterLayout>('VERTICAL');

  onFiltersChange = output<CalendarFilters>();

  filters = signal<CalendarFilters>({
    status: [],
    onlyRisky: false,
    onlyOverdue: false
  });

  showAdvanced = signal(false);
  operatorId = 'all';

  icons = { Filter, X, ChevronDown, User, Cpu, AlertCircle, Sparkles, RefreshCw, Settings2 };

  cn(...args: any[]) { return args.filter(Boolean).join(' '); }

  isReset() {
    return this.filters().status.length === 0 && !this.filters().onlyRisky && !this.filters().onlyOverdue && this.operatorId === 'all';
  }

  toggleRisky() {
    this.filters.update(f => ({ ...f, onlyRisky: !f.onlyRisky }));
    this.onFilterChange();
  }

  toggleOverdue() {
    this.filters.update(f => ({ ...f, onlyOverdue: !f.onlyOverdue }));
    this.onFilterChange();
  }

  isStatusSelected(status: string) {
    return this.filters().status.includes(status);
  }

  toggleStatus(status: string) {
    this.filters.update(f => {
      const current = [...f.status];
      const idx = current.indexOf(status);
      if (idx === -1) current.push(status);
      else current.splice(idx, 1);
      return { ...f, status: current };
    });
    this.onFilterChange();
  }

  onFilterChange() {
    this.onFiltersChange.emit({
      ...this.filters(),
      operatorId: this.operatorId === 'all' ? undefined : this.operatorId
    });
  }

  resetFilters() {
    this.filters.set({
      status: [],
      onlyRisky: false,
      onlyOverdue: false
    });
    this.operatorId = 'all';
    this.onFilterChange();
  }
}
