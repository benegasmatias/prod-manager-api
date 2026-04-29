import { Component, inject, signal, OnInit, computed, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { PageShellComponent } from '@shared/ui';
import { PedidosApiService } from '../../core/api/pedidos.api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SessionService } from '../../core/session/session.service';
import { Pedido, OrderStatus, PedidoSummary, Employee, ORDER_STATUS } from '../../shared/models';
import { LucideAngularModule } from 'lucide-angular';
import { OrderStatusModalComponent } from './status-modal/status-modal.component';
import { SkeletonComponent, SearchFilterBarComponent, OrdersTableComponent, PaginatorComponent, PageSizeSelectorComponent, FilterOptions, FilterValues, LoadingSpinnerComponent } from '../../shared/ui';
import { PedidoSortKey, PedidoSortDir } from '../../shared/models/pedido';
import { PEDIDOS_LABELS, PEDIDOS_ICONS } from './pedidos.config';
import { getStatusLabel, getStatusStyles } from '@shared/utils';
import { cn } from '@shared/utils/cn';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm-dialog.component';
import { LayoutService } from '../../core/layout/layout.service';
import { StockService } from '../../core/api/stock.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface PedidosFilters {
  search?: string;
  status?: string;
  urgency?: string;
  alertFilter?: string;
  technician?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    OrderStatusModalComponent,
    OrdersTableComponent,
    PaginatorComponent,
    LoadingSpinnerComponent,
    PageShellComponent
  ],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(PedidosApiService);
  public session = inject(SessionService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmService);
  public layout = inject(LayoutService);
  public stockService = inject(StockService);
  cn = cn;

  activeTab = signal<'active' | 'draft' | 'history'>('active');
  activeMobileSector = signal<'active' | 'draft' | 'history'>('active');
  isMobile = computed(() => this.layout.isMobile());
  headerVisible = signal(true);
  private lastScroll = 0;

  // Labels and Icons for Template
  protected readonly labels = PEDIDOS_LABELS;
  protected readonly icons = PEDIDOS_ICONS;
  loading = signal(false);
  error = signal<string | null>(null);
  summary = signal<PedidoSummary>({ totalVolume: 0, pendingBalance: 0, activeCount: 0 });
  employees = signal<Employee[]>([]);

  // Context Signals
  businessId = computed(() => this.session.activeNegocio()?.id || '');
  negocio = computed(() => this.session.activeNegocio());

  // Filters State (Single Source of Truth)
  filters = signal<PedidosFilters>({});
  searchControl = new FormControl('');

  // Backwards compatibility for templates/UI components
  searchTerm = computed(() => this.filters().search || '');
  estadoFilter = computed(() => this.filters().status || 'all');
  urgenciaFilter = computed(() => this.filters().urgency || 'all');
  tecnicoFilter = computed(() => this.filters().technician || 'all');
  dateDesde = computed(() => this.filters().startDate || '');
  dateHasta = computed(() => this.filters().endDate || '');
  alertFilter = computed(() => this.filters().alertFilter || null);

  // Plan Usage
  planUsage = this.session.planUsage;
  canAddOrder = computed(() => this.planUsage()?.canCreate.orders ?? true);

  // UI State
  selectedOrder = signal<Pedido | null>(null);
  isModalOpen = signal(false);

  // Pagination State
  pageSize = 5;

  ordersData = signal<Pedido[]>([]);
  currentPage = signal(1);
  totalOrders = signal(0);
  showFilters = signal(false);

  // Sort State
  sortKey = signal<PedidoSortKey>('fechaActualizacion');
  sortDir = signal<PedidoSortDir>('desc');

  // Filters computed for the bar
  currentFilterValues = computed<FilterValues>(() => ({
    search: this.searchTerm(),
    status: this.estadoFilter(),
    urgency: this.urgenciaFilter(),
    technician: this.tecnicoFilter(),
    startDate: this.dateDesde(),
    endDate: this.dateHasta(),
    alertFilter: this.alertFilter()
  }));

  activeFilterCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.search) count++;
    if (f.status && f.status !== 'all') count++;
    if (f.urgency && f.urgency !== 'all') count++;
    if (f.technician && f.technician !== 'all') count++;
    if (f.startDate || f.endDate) count++;
    if (f.alertFilter) count++;
    return count;
  });

  activeChips = computed(() => {
    const f = this.filters();
    const chips: { key: keyof PedidosFilters, label: string, value: string }[] = [];

    if (f.status && f.status !== 'all') {
      const label = this.filterOptions().statuses?.find(s => s.value === f.status)?.label || f.status;
      chips.push({ key: 'status', label: `Estado: ${label}`, value: f.status });
    }
    if (f.technician && f.technician !== 'all') {
      const emp = this.employees().find(e => e.id === f.technician);
      const label = emp ? `${emp.firstName} ${emp.lastName}` : f.technician;
      chips.push({ key: 'technician', label: `Técnico: ${label}`, value: f.technician });
    }
    if (f.urgency && f.urgency !== 'all') {
      chips.push({ key: 'urgency', label: `Urgencia: ${f.urgency}`, value: f.urgency });
    }
    if (f.alertFilter) {
      const label = f.alertFilter === 'due-soon' ? 'Vencen hoy o mañana' : 'Vencidos sin entregar';
      chips.push({ key: 'alertFilter', label: `Alerta: ${label}`, value: f.alertFilter });
    }
    if (f.startDate) chips.push({ key: 'startDate', label: `Desde: ${f.startDate}`, value: f.startDate });
    if (f.endDate) chips.push({ key: 'endDate', label: `Hasta: ${f.endDate}`, value: f.endDate });

    return chips;
  });

  filterOptions = computed<FilterOptions>(() => {
    const config = this.session.config();
    return {
      statuses: config?.productionStages.map((s: any) => ({ label: s.label, value: s.key })),
      technicians: this.employees(),
      urgencies: [
        { label: 'VENCIDO', value: 'VENCIDO' },
        { label: 'PRÓXIMO', value: 'PRÓXIMO' },
        { label: 'EN TIEMPO', value: 'EN TIEMPO' },
        { label: 'LISTO', value: 'LISTO' }
      ]
    };
  });

  // Sorted Computeds for UI
  sortedOrders = computed(() => this.sortOrders([...this.ordersData()]));

  hasPedidos = computed(() => this.totalOrders() > 0);

  private lastLoadedBusinessId: string | null = null;

  @ViewChild('historyTrigger') historyTrigger?: ElementRef;
  private observer?: IntersectionObserver;

  constructor() {
    // Refresh when businessId changes
    effect(() => {
      const bid = this.businessId();
      if (bid && bid !== this.lastLoadedBusinessId) {
        this.loadData();
      }
    });

    effect(() => {
      if (this.layout.isMobile()) {
        this.layout.fabAction.set({
          action: () => this.router.navigate(['/pedidos/nuevo']),
          icon: this.icons.PLUS
        });
      } else {
        this.layout.fabAction.set(null);
      }
    });
  }

  setTab(tab: 'active' | 'draft' | 'history') {
    this.activeTab.set(tab);
    this.activeMobileSector.set(tab);
    this.currentPage.set(1);
    this.loadData();
  }

  scrollToSector(sector: 'active' | 'draft' | 'history') {
    this.setTab(sector);
    const element = document.getElementById(`pedidos-table`);
    if (element) {
      const offset = 180; // Offset for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  ngAfterViewInit() {
    this.setupObserver();
    this.setupScrollListener();
  }

  private setupScrollListener() {
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll <= 0) {
        this.headerVisible.set(true);
        return;
      }

      if (currentScroll > this.lastScroll && currentScroll > 100) {
        // Scrolling down
        this.headerVisible.set(false);
      } else if (currentScroll < this.lastScroll) {
        // Scrolling up
        this.headerVisible.set(true);
      }
      this.lastScroll = currentScroll;
    }, { passive: true });
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }

  private setupObserver() {
    // Observer removed as we now use tabs instead of infinite scroll/lazy sectors
  }

  ngOnInit() {
    // REGLA: Usar suscripción para reaccionar a cambios en queryParams sin recargar componente
    this.route.queryParamMap.subscribe(params => {
      const newFilters: PedidosFilters = {
        search: params.get('search') || undefined,
        status: params.get('status') || undefined,
        urgency: params.get('urgency') || undefined,
        alertFilter: params.get('alertFilter') || undefined,
        technician: params.get('technician') || undefined,
        startDate: params.get('startDate') || undefined,
        endDate: params.get('endDate') || undefined,
        page: params.get('page') ? Number(params.get('page')) : undefined
      };

      // Sincronizar control de búsqueda si el valor es diferente
      if (this.searchControl.value !== (newFilters.search || '')) {
        this.searchControl.setValue(newFilters.search || '', { emitEvent: false });
      }

      this.filters.set(newFilters);
      if (newFilters.page) this.currentPage.set(newFilters.page);
      this.loadData();
    });

    // Debounce search
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {
      this.onFilterChange({ key: 'search', value });
    });
  }

  onSort(key: string) {
    const sortKey = key as PedidoSortKey;
    if (this.sortKey() === sortKey) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(sortKey);
      this.sortDir.set('asc');
    }
    // No need to loadData as sorting is client-side for the current page
  }

  private sortOrders(orders: Pedido[]): Pedido[] {
    const key = this.sortKey();
    const dir = this.sortDir();

    return orders.sort((a, b) => {
      let valA: any = (a as any)[key];
      let valB: any = (b as any)[key];

      if (key === 'dueDate' || key === 'createdAt' || key === 'updatedAt' || key === 'fechaActualizacion' || key === 'fechaEntrega') {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return dir === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (key === 'code') {
        return dir === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      }

      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return dir === 'asc' ? numA - numB : numB - numA;
      }

      const comparison = String(valA || '').localeCompare(String(valB || ''));
      return dir === 'asc' ? comparison : -comparison;
    });
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  onFilterChange({ key, value }: { key: string, value: any }) {
    const current = this.filters();
    const queryParams: any = { ...current };

    // Al cambiar un filtro, reseteamos a la página 1
    queryParams.page = 1;

    // Manejo de valores nulos/vacíos para limpiar URL
    const cleanValue = (value === 'all' || value === '' || value === null || value === undefined) ? null : value;

    if (key === 'search') queryParams.search = cleanValue;
    if (key === 'status') queryParams.status = cleanValue;
    if (key === 'technician') queryParams.technician = cleanValue;
    if (key === 'urgency') {
      queryParams.urgency = cleanValue;
      // Al cambiar urgencia manualmente, el alertFilter del dashboard se anula por UX
      queryParams.alertFilter = null;
    }
    if (key === 'startDate') queryParams.startDate = cleanValue;
    if (key === 'endDate') queryParams.endDate = cleanValue;
    if (key === 'alertFilter') queryParams.alertFilter = cleanValue;

    // Actualizamos la URL. El suscriptor en ngOnInit se encargará de actualizar el signal y llamar a loadData()
    // IMPORTANTE: Para eliminar parámetros, no usamos 'merge' sino que calculamos el set final
    const currentParams = this.route.snapshot.queryParams;
    const nextParams = { ...currentParams, ...queryParams };

    // Limpiamos nulos/vacíos para que desaparezcan de la URL
    Object.keys(nextParams).forEach(k => {
      if (nextParams[k] === null || nextParams[k] === undefined || nextParams[k] === '') {
        delete nextParams[k];
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: nextParams,
      replaceUrl: true
    });
  }

  removeFilter(key: keyof PedidosFilters) {
    this.onFilterChange({ key, value: null });
  }

  async loadData() {
    this.loadGlobalData();
    const bId = this.businessId();
    if (!bId) return;

    this.loading.set(true);
    this.session.refreshPlanUsage();

    try {
      const tab = this.activeTab();
      const params: any = {
        ...this.getCommonParams(),
        page: this.currentPage(),
        pageSize: this.pageSize
      };

      if (tab === 'active') {
        params.excludeStatuses = 'DRAFT,DELIVERED,CANCELLED';
      } else if (tab === 'draft') {
        params.statuses = 'DRAFT';
      } else if (tab === 'history') {
        params.statuses = 'DELIVERED,CANCELLED';
      }

      const res = await this.api.getListing(params);
      this.ordersData.set(res.data);
      this.totalOrders.set(res.total || 0);
      this.syncSelectedOrder(res.data);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private getCommonParams() {
    const f = this.filters();
    return {
      businessId: this.businessId(),
      search: f.search || undefined,
      status: (f.status && f.status !== 'all') ? f.status : undefined,
      startDate: f.startDate || undefined,
      endDate: f.endDate || undefined,
      responsableId: (f.technician && f.technician !== 'all') ? f.technician : undefined,
      urgency: (f.urgency && f.urgency !== 'all') ? f.urgency : undefined,
      alertFilter: f.alertFilter || undefined,
      type: 'CLIENT' // Excluir pedidos de Stock
    };
  }

  async loadGlobalData() {
    const bId = this.businessId();
    if (!bId) return;
    try {
      const empsRes = await this.api.getEmployees(bId);
      this.employees.set(empsRes);
      this.lastLoadedBusinessId = bId;
    } catch (err) { console.error('Error global data:', err); }
  }

  // Consolidated methods replaced by loadData() logic above

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage.set(1);
    this.loadData();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  private syncSelectedOrder(newData: Pedido[]) {
    const current = this.selectedOrder();
    if (!current) return;

    const updated = newData.find(o => o.id === current.id);
    if (updated) {
      this.selectedOrder.set(updated);
    }
  }

  goToDetail(order: Pedido) {
    this.router.navigate(['/pedidos', order.id]);
  }

  openManageModal(order: Pedido) {
    this.selectedOrder.set(order);
    this.isModalOpen.set(true);
  }

  handleSort(key: string) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  clearFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.router.navigate([], {
      queryParams: {}, // Limpiar todos
      replaceUrl: true
    });
  }

  clearAlertFilter() {
    this.onFilterChange({ key: 'alertFilter', value: null });
  }

  getStatusStyles(status: OrderStatus): string {
    return getStatusStyles(status, this.negocio()?.rubro);
  }

  getStatusLabel(status: OrderStatus): string {
    return getStatusLabel(status, this.negocio()?.rubro);
  }

  async handleDelete(order: Pedido) {
    const ok = await this.confirm.confirm({
      title: 'Eliminar Pedido',
      message: `¿Estás seguro de que deseas eliminar permanentemente el pedido #${order.code}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar Ahora',
      cancelLabel: 'Cancelar',
      type: 'danger'
    });

    if (ok) {
      try {
        await this.api.delete(order.id, order.businessId);
        await this.loadData();
        this.stockService.loadStock();
      } catch (err) {
        console.error('Error deleting order:', err);
        alert('No se pudo eliminar el pedido.');
      }
    }
  }
}
