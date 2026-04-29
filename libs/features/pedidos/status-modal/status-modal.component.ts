import {
  Component, computed, inject, signal, input, Output,
  EventEmitter, OnInit, effect, HostListener, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule, X, Gauge, Cpu, User, Calendar, CreditCard,
  DollarSign, AlertOctagon, Layers, CheckCircle2, MessageSquare,
  RefreshCw, ChevronDown, ChevronLeft, Check, ChevronRight, Clock, Truck, XCircle, Plus, Minus, ExternalLink, Star
} from 'lucide-angular';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm-dialog.component';
import { ButtonSpinnerComponent } from '@shared/ui';
import { Pedido, Employee, OrderStatus, OrderItemStatus } from '@shared/models/pedido';
import { PedidosApiService } from '@core/api/pedidos.api.service';
import { MaquinasApiService } from '@core/api/maquinas.api.service';
import { MaterialesApiService } from '@core/api/materiales.api.service';
import { SessionService } from '@core/session/session.service';
import { MaquinasService } from '@core/api/maquinas.service';
import { MaterialesService } from '@core/api/materiales.service';
import { getNegocioConfig, getStatusLabel, getStatusStyles } from '@shared/utils/negocio-utils';
import { cn } from '@shared/utils/cn';
import { AppDatePickerComponent } from '@shared/ui/app-date-picker/app-date-picker.component';
import { Machine, Material } from '@shared/models';
import { MaterialSelectorComponent } from '@shared/ui/material-selector/material-selector.component';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';

// Sections
import { PaymentModuleComponent } from './sections/payment-module.component';
import { FailureModuleComponent } from './sections/failure-module.component';
import { MultiMaterial } from '@shared/models/material-consumption';

@Component({
  selector: 'app-order-status-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FormsModule,
    ButtonSpinnerComponent,
    PaymentModuleComponent,
    FailureModuleComponent,
    AppDatePickerComponent,
    MaterialSelectorComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './status-modal.component.html',
  styleUrls: ['./status-modal.component.css']
})
export class OrderStatusModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(PedidosApiService);
  private maquinasApi = inject(MaquinasApiService);
  private materialesApi = inject(MaterialesApiService);
  private session = inject(SessionService);
  private maquinasService = inject(MaquinasService);
  private materialesService = inject(MaterialesService);
  private cdr = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);

  order = input<Pedido | null>(null);
  isOpen = input<boolean>(false);
  employees = input<Employee[]>([]);
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();

  // UI State
  status = signal<string>('');
  responsableGeneralId = signal<string>('');
  notes = signal<string>('');
  
  protected readonly PRODUCTION_STAGES = [
    { key: 'PENDING', label: 'Pendiente', icon: 'Clock' },
    { key: 'IN_PROGRESS', label: 'En Proceso', icon: 'Cpu' },
    { key: 'READY', label: 'Listo', icon: 'CheckCircle2' },
    { key: 'DELIVERED', label: 'Entregado', icon: 'Truck' }
  ];

  activeStages = computed(() => {
    return this.PRODUCTION_STAGES;
  });

  currentGlobalStep = computed(() => {
    const s = this.status();
    if (s === 'PENDING') return 0;
    if (['DESIGN', 'IN_PRODUCTION', 'PRINTING', 'REPRINT_PENDING', 'RE_WORK', 'POST_PROCESS', 'CUTTING', 'WELDING', 'ASSEMBLY', 'PAINTING', 'INSTALACION_OBRA', 'IN_PROGRESS'].includes(s)) {
      return 1;
    }
    if (['READY', 'READY_FOR_DELIVERY', 'DONE'].includes(s)) return 2;
    if (s === 'DELIVERED') return 3;
    return 1;
  });

  isSaving = signal(false);

  @ViewChild('stepperViewport') stepperViewport?: ElementRef<HTMLElement>;
  canScrollLeft = signal(false);
  canScrollRight = signal(false);
  private scrollInterval?: any;
  private isJumping = signal(false);

  isPaymentMode = signal(false);
  
  isFailureMode = computed(() => !!this.selectedItemForFailureId());
  
  paymentAmount = signal<number>(0);
  paymentMethod = signal<string>('CASH');
  saving = computed(() => this.isSaving());
  isProcessingGlobal = computed(() => this.updatingItemIds().size > 0);
  
  updatingItemIds = signal<Set<string>>(new Set());
  selectedMachineIdForItem = signal<string>('');
  filamentAssignments = signal<{ materialId: string; grams: number }[]>([{ materialId: '', grams: 0 }]);
  selectedItemForFailureId = signal<string | null>(null);
  selectedItemForFailure = computed(() => {
    const id = this.selectedItemForFailureId();
    return (this.order()?.items || []).find((i: any) => i.id === id);
  });
  isMaterialSelectorOpen = signal<boolean>(false);

  // Failure state
  failureReason = signal('');
  failureAction = signal<'REDO' | 'DISCARD' | 'KEEP'>('REDO');
  wastedTime = signal(0);
  failureMaterialWastes = signal<{ materialId: string, grams: number }[]>([]);
  selectedFailureMaterialId = signal<string | null>(null);
  selectedFailureMaterial = computed(() => this.materials().find(m => m.id === this.selectedFailureMaterialId()));

  openFailureReport(item: any) {
    this.selectedItemForFailureId.set(item.id);
    this.failureReason.set('');
    this.failureAction.set('REDO');
    this.wastedTime.set(0);
    
    // AUTO-DETECCIÓN DE FILAMENTOS:
    // Priorizamos los materiales que fueron asignados específicamente a este trabajo (Job)
    const activeJob: any = item.job || (item as any).productionJob;
    const jobMaterials = activeJob?.metadata?.materials;
    const machineMaterials = activeJob?.machine?.metadata?.materials;

    if (jobMaterials && Array.isArray(jobMaterials) && jobMaterials.length > 0) {
      this.failureMaterialWastes.set(
        jobMaterials.map((m: any) => ({ materialId: m.materialId, grams: 0 }))
      );
    } else if (activeJob?.materialId) {
      // Fallback a materialId simple si no hay multi-material
      this.failureMaterialWastes.set([{ materialId: activeJob.materialId, grams: 0 }]);
    } else if (machineMaterials && Array.isArray(machineMaterials) && machineMaterials.length > 0) {
      // Fallback final a lo que tenga cargado la máquina actualmente
      this.failureMaterialWastes.set(
        machineMaterials.map((m: any) => ({ materialId: m.materialId, grams: 0 }))
      );
    } else {
      // Si no hay nada, ítem vacío para selección manual
      this.failureMaterialWastes.set([{ materialId: '', grams: 0 }]);
    }

    // Scroll suave al área de falla
    setTimeout(() => {
      const element = document.getElementById('failure-section');
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  failureMaterialPickingIndex = signal<number | null>(null);

  openMaterialSelectorForRow(index: number) {
    this.failureMaterialPickingIndex.set(index);
    this.isMaterialSelectorOpen.set(true);
  }

  handleRemoveFailureMaterial(index: number) {
    this.failureMaterialWastes.update(list => list.filter((_, i) => i !== index));
  }

  handleFailureMaterialChange(index: number, materialId: string) {
    this.failureMaterialWastes.update(list => {
      const newList = [...list];
      newList[index] = { ...newList[index], materialId };
      return newList;
    });
  }

  handleFailureGramsChange(index: number, grams: number) {
    this.failureMaterialWastes.update(list => {
      const newList = [...list];
      newList[index] = { ...newList[index], grams };
      return newList;
    });
  }

  addFailureMaterial() {
    this.failureMaterialWastes.update(list => [...list, { materialId: '', grams: 0 }]);
  }

  // Metalurgica Specific
  tipoTrabajo = signal<string>('');
  itemName = signal<string>('');
  measurements = signal<string>('');
  visitAddress = signal<string>('');
  visitDate = signal<string>('');
  visitTime = signal<string>('');
  visitObservations = signal<string>('');
  totalPrice = signal<number>(0);
  senia = signal<number>(0);

  // 3D Specific
  selectedMachineId = signal<string>('');
  multiMaterials = signal<MultiMaterial[]>([]);
  machines = signal<Machine[]>([]);
  materials = signal<Material[]>([]);
  itemToAssignId = signal<string | null>(null);

  goToEdit() {
    const order = this.order();
    if (!order) return;
    this.onClose.emit();
    this.router.navigate(['/pedidos/editar', order.id]);
  }

  icons: any = {
    Gauge, AlertOctagon, DollarSign, X, Layers, CheckCircle2,
    User, Calendar, MessageSquare, RefreshCw, ChevronDown, ChevronLeft, Cpu, Check, ChevronRight,
    Clock, Truck, XCircle, Plus, Minus, ExternalLink, Star
  };

  getIcon(name: string): any {
    return this.icons[name] || this.icons.Check;
  }

  rubro = computed(() => this.session.activeNegocio()?.rubro || 'GENERICO');
  isMetalurgica = computed(() => this.rubro() === 'METALURGICA');
  is3D = computed(() => this.rubro() === 'IMPRESION_3D');

  totalVal = computed(() => Number(this.order()?.totalPrice || 0));
  paidVal = computed(() => {
    const o = this.order();
    if (!o) return 0;
    if (o.payments && o.payments.length > 0) {
       return o.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    }
    return Number(o.totalPayments || 0);
  });
  balanceVal = computed(() => Math.max(0, this.totalVal() - this.paidVal()));
  isFullyPaid = computed(() => this.balanceVal() < 0.01);
  isReadyState = computed(() => ['READY', 'READY_FOR_DELIVERY', 'DONE'].includes(this.status()));
  isDeliveredState = computed(() => this.status() === 'DELIVERED');

  config = computed(() => getNegocioConfig(this.rubro()));

  stages = computed(() => {
    const all = this.config().productionStages;
    const order = this.order();
    if (!order) return all;
    const current = order.status;
    const isMetal = this.isMetalurgica();

    return all.filter(s => {
      if (current === s.key) return true;
      if (s.key === 'FAILED') return false;
      if (isMetal) {
        const visitStatusList = ['SITE_VISIT', 'SITE_VISIT_DONE', 'VISITA_REPROGRAMADA', 'VISITA_CANCELADA', 'SURVEY_DESIGN'];
        const budgetStatusList = ['QUOTATION', 'BUDGET_GENERATED', 'BUDGET_REJECTED'];
        if (budgetStatusList.includes(current)) {
          return [...budgetStatusList, 'APPROVED'].includes(s.key);
        } else if (visitStatusList.includes(current)) {
          return [...visitStatusList, 'QUOTATION'].includes(s.key);
        } else if (current !== 'PENDING') {
          return ![...visitStatusList, ...budgetStatusList].includes(s.key);
        }
      }
      return true;
    });
  });

  ngOnInit() {
    this.resetForm();
  }

  ngAfterViewInit() {
    this.checkStepperOverflow();
  }

  scrollStepper(direction: 'left' | 'right') {
    this.stopContinuousScroll();
    const el = this.stepperViewport?.nativeElement;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.7, 240);
    const left = direction === 'left' ? -amount : amount;
    el.scrollBy({ left, behavior: 'smooth' });
    this.isJumping.set(true);
    setTimeout(() => {
      this.isJumping.set(false);
      this.checkStepperOverflow();
    }, 600);
  }

  startContinuousScroll(direction: 'left' | 'right') {
    if (this.scrollInterval || this.isJumping()) return;
    this.scrollInterval = setInterval(() => {
      const el = this.stepperViewport?.nativeElement;
      if (!el) return;
      el.scrollBy({ left: direction === 'left' ? -5 : 5, behavior: 'auto' });
      this.checkStepperOverflow();
    }, 16);
  }

  stopContinuousScroll() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = undefined;
    }
  }

  checkStepperOverflow() {
    const el = this.stepperViewport?.nativeElement;
    if (!el) return;
    this.canScrollLeft.set(el.scrollLeft > 10);
    this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }

  private autoCenterActiveStep() {
    setTimeout(() => {
      const el = this.stepperViewport?.nativeElement;
      if (!el || !this.isOpen()) return;
      const activeBtn = el.querySelector('.bg-primary') as HTMLElement;
      if (activeBtn) {
        const scrollOffset = activeBtn.offsetLeft - (el.clientWidth / 2) + (activeBtn.clientWidth / 2);
        el.scrollTo({ left: scrollOffset, behavior: 'smooth' });
      }
      this.checkStepperOverflow();
    }, 100);
  }

  public resetForm() {
    const order = this.order();
    if (order) {
      this.status.set(order.status);
      this.responsableGeneralId.set(order.responsableGeneral?.id || '');
      this.notes.set(order.notes || '');
      this.isPaymentMode.set(false);
      this.selectedItemForFailureId.set(null);
      
      const total = Number(order.totalPrice || 0);
      const paid = order.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      this.paymentAmount.set(Math.max(0, total - paid));

      this.totalPrice.set(total);
      this.visitAddress.set((order?.metadata as any)?.['direccion_obra'] || (order as any)['direccion_obra'] || '');
      this.visitDate.set((order as any)['fecha_visita'] || '');
      this.visitTime.set((order as any)['hora_visita'] || '');
      this.visitObservations.set((order as any)['observaciones_visita'] || '');

      const firstItem = (order.items && order.items.length > 0) ? order.items[0] : null;
      if (firstItem) {
        this.itemName.set(firstItem.nombreProducto || '');
        this.measurements.set((firstItem as any).medidas || '');
        this.tipoTrabajo.set((firstItem as any).tipo_trabajo || '');
      }
    }
  }

  _onProductionPhase = effect(() => {
    const currentStatus = this.status();
    const isAssigning = !!this.itemToAssignId();
    if (this.is3D() && (['IN_PROGRESS', 'IN_PRODUCTION'].includes(currentStatus) || isAssigning)) {
      this.load3DData();
    }
  });

  async load3DData(force = false) {
    const businessId = this.session.activeId();
    if (!businessId || (!force && this.machines().length > 0)) return;
    try {
      const resp = await this.maquinasApi.getAll(businessId);
      const mats = await this.materialesApi.getAll(businessId);
      this.machines.set(resp.data || []);
      this.materials.set(mats || []);
    } catch (error) {
      console.error('Error loading 3D data:', error);
    }
  }

  _onOrderChange = effect(() => {
    if (this.order() && this.isOpen()) {
      this.resetForm();
      this.autoCenterActiveStep();
      this.updatingItemIds.set(new Set<string>());
    }
  }, { allowSignalWrites: true });

  _scrollLock = effect(() => {
    if (this.isOpen()) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  });

  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    if (this.isOpen() && !this.isSaving()) {
      this.onClose.emit();
    }
  }

  ngOnDestroy() {
    this.stopContinuousScroll();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  saveFailure() {
    this.handleSave();
  }

  savePayment() {
    this.handleSave();
  }

  showMaterialSelectorForFailure() {
    this.isMaterialSelectorOpen.set(true);
  }

  handleMaterialSelectedForFailure(materialId: string) {
    const index = this.failureMaterialPickingIndex();
    if (index !== null) {
      this.handleFailureMaterialChange(index, materialId);
      this.failureMaterialPickingIndex.set(null);
    } else {
      this.selectedFailureMaterialId.set(materialId || null);
    }
    this.isMaterialSelectorOpen.set(false);
  }

  async handleSave() {
    const order = this.order();
    if (!order) return;
    this.isSaving.set(true);
    try {
      if (this.isPaymentMode()) {
        await this.api.addPayment(order.id, {
          businessId: order.businessId,
          amount: this.paymentAmount(),
          method: this.paymentMethod()
        });
      } else if (this.isFailureMode()) {
        const targetStatus = this.failureAction() === 'DISCARD' ? 'FAILED' : (this.rubro() === 'IMPRESION_3D' ? 'REPRINT_PENDING' : 'RE_WORK');
        const wastes = this.failureMaterialWastes();
        
        await this.api.reportFailure(order.id, {
          businessId: order.businessId,
          itemId: this.selectedItemForFailureId() || undefined,
          reason: this.failureReason(),
          action: this.failureAction(),
          wastedGrams: wastes.reduce((acc, curr) => acc + (curr.grams || 0), 0),
          materialWastes: wastes,
          targetStatus,
          metadata: {
            wastedTime: this.wastedTime()
          }
        });
      } else {
        const updateData: any = {
          businessId: order.businessId,
          status: this.status() as OrderStatus,
          responsableGeneralId: this.responsableGeneralId() || null,
          notes: this.notes(),
          totalPrice: Number(this.totalPrice()) || 0,
        };
        await this.api.update(order.id, updateData);
      }

      if (this.is3D()) {
        await this.maquinasService.loadMaquinas(true);
        await this.materialesService.loadMateriales(true);
      }
      this.onSave.emit();
      this.onClose.emit();
    } catch (err) {
      console.error('Error in handleSave:', err);
      this.confirmService.confirm({
        title: 'Error',
        message: 'Error al procesar la operación.',
        hideCancel: true,
        type: 'danger'
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  async deliverOrder() {
    const order = this.order();
    if (!order) return;
    if (!this.isFullyPaid()) {
      const confirmDebt = await this.confirmService.confirm({
        title: 'Saldo Pendiente',
        message: `Atención: El pedido tiene un saldo pendiente de $${this.balanceVal()}. ¿Deseas entregarlo de todas formas?`,
        confirmLabel: 'Entregar Igual',
        type: 'warning'
      });
      if (!confirmDebt) return;
    } else {
      const confirmDelivery = await this.confirmService.confirm({
        title: 'Confirmar Entrega',
        message: '¿Confirmar la entrega del pedido? Esta acción lo moverá al historial.',
        confirmLabel: 'Entregar',
        type: 'info'
      });
      if (!confirmDelivery) return;
    }
    this.isSaving.set(true);
    try {
      await this.api.update(order.id, { 
        status: 'DELIVERED',
        businessId: order.businessId 
      });
      this.onSave.emit();
      this.onClose.emit();
    } catch (err) {
      console.error('Error delivering order:', err);
      this.confirmService.confirm({
        title: 'Error',
        message: 'No se pudo marcar el pedido como entregado.',
        hideCancel: true,
        type: 'danger'
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  async updateItemStatus(itemId: string, status: string, name: string = '') {
    const order = this.order();
    if (!order || this.updatingItemIds().has(itemId)) return;

    if (status === 'CANCELLED') {
      const confirmed = await this.confirmService.confirm({
        title: 'Cancelar Ítem',
        message: `¿Estás seguro de cancelar el ítem "${name}"?`,
        confirmLabel: 'Sí, cancelar',
        type: 'warning'
      });
      if (!confirmed) return;
    }

    this.updatingItemIds.update((ids: Set<string>) => {
      const newIds = new Set(ids);
      newIds.add(itemId);
      return newIds;
    });

    try {
      await this.api.updateItemStatus(order.id, itemId, status, order.businessId);
      this.onSave.emit();
    } catch (e: any) {
      console.error('Error updating item status:', e);
      // Solo limpiamos si hay error, si es éxito esperamos al refresco del input order()
      this.updatingItemIds.update((ids: Set<string>) => {
        const newIds = new Set(ids);
        newIds.delete(itemId);
        return newIds;
      });

      const isMachineError = e.error?.message?.includes('trabajo activo en máquina');
      
      if (isMachineError) {
         const targetItem = order.items?.find((i: any) => i.id === itemId);
         const itemJob = targetItem?.job || (targetItem as any)?.productionJob;
         let machineId = itemJob?.machine?.id || itemJob?.machineId;
         
         if (!machineId && order.jobs) {
           const job = (order.jobs as any[]).find(j => (j.orderItemId === itemId || j.itemId === itemId));
           machineId = job?.machineId || job?.machine?.id;
         }

         const confirmed = await this.confirmService.confirm({
            title: 'Ítem en Máquina',
            message: e.error.message + '\n¿Deseas liberar la máquina y forzar el cambio de estado ahora?',
            confirmLabel: 'Liberar y Cambiar',
            cancelLabel: 'Cancelar',
            type: 'warning'
         });

         if (confirmed) {
            if (machineId) {
               // Re-activamos el estado de carga para el re-intento
               this.updatingItemIds.update(ids => {
                  const newIds = new Set(ids);
                  newIds.add(itemId);
                  return newIds;
               });

               try {
                  await this.maquinasApi.release(machineId, order.businessId);
                  await this.api.updateItemStatus(order.id, itemId, status, order.businessId);
                  this.onSave.emit();
                  // No limpiamos el ID aquí, esperamos al onOrderChange como en el flujo normal
               } catch (err2) {
                  console.error('Error in release and retry:', err2);
                  // Si falló el re-intento, tenemos que limpiar el estado de carga manualmente
                  this.updatingItemIds.update(ids => {
                    const newIds = new Set(ids);
                    newIds.delete(itemId);
                    return newIds;
                  });
                  this.confirmService.confirm({
                      title: 'Error',
                      message: 'No se pudo liberar la máquina automáticamente.',
                      hideCancel: true,
                      type: 'danger'
                  });
               }
            } else {
               this.confirmService.confirm({
                  title: 'Información Faltante',
                  message: 'No pudimos identificar la máquina vinculada a este ítem. Intente refrescar la página.',
                  hideCancel: true,
                  type: 'warning'
               });
            }
         }
      } else {
         this.confirmService.confirm({
            title: 'Error',
            message: e.error?.message || 'Error al actualizar el ítem.',
            hideCancel: true,
            type: 'danger'
         });
      }
    }
  }

  addFilamentAssignment() {
    const machine = this.machines().find(m => m.id === this.selectedMachineIdForItem());
    const max = machine?.maxFilaments || 1;
    if (this.filamentAssignments().length < max) {
      this.filamentAssignments.update(list => [...list, { materialId: '', grams: 0 }]);
    }
  }

  removeFilamentAssignment(index: number) {
    if (this.filamentAssignments().length > 1) {
      this.filamentAssignments.update(list => list.filter((_, i) => i !== index));
    }
  }

  updateFilamentAssignment(index: number, data: Partial<{ materialId: string; grams: number }>) {
    this.filamentAssignments.update(list => {
      const newList = [...list];
      const finalGrams = data.grams !== undefined ? Math.max(0, data.grams) : newList[index].grams;
      newList[index] = { ...newList[index], ...data, grams: finalGrams };
      return newList;
    });
  }

  async prepareAssign(itemId: string) {
    this.itemToAssignId.set(itemId);
    await this.load3DData(true); // Force refresh machines before showing selector
    
    // Buscar los datos pre-guardados del item (peso)
    const item = this.order()?.items?.find((i: any) => i.id === itemId);
    const weight = (item as any)?.weightGrams || (item as any)?.weight || 0;
    
    this.filamentAssignments.set([{ materialId: '', grams: weight }]);
    
    const available = this.machines().filter(m => m.status === 'IDLE');
    if (available.length > 0) {
      this.selectedMachineIdForItem.set(available[0].id);
    }
    if (this.is3D()) {
      this.materialesService.loadMateriales(true);
    }
  }

  cancelAssign() {
    this.itemToAssignId.set(null);
    this.selectedMachineIdForItem.set('');
    this.filamentAssignments.set([{ materialId: '', grams: 0 }]);
  }

  async startItemProduction(itemId: string) {
    const order = this.order();
    const machineId = this.selectedMachineIdForItem();
    const assignments = this.filamentAssignments();
    
    if (!order || !machineId || !itemId) return;

    this.updatingItemIds.update((ids: Set<string>) => {
      const newIds = new Set(ids);
      newIds.add(itemId);
      return newIds;
    });

    try {
      const metadata = this.is3D() ? { 
        materials: assignments.map(a => ({
          materialId: a.materialId,
          gramsPerUnit: a.grams / (order?.items.find(i => i.id === itemId)?.qty || 1)
        })),
        estimatedGrams: assignments.reduce((acc, curr) => acc + curr.grams, 0)
      } : undefined;

      await this.maquinasApi.assignOrder(
        machineId, 
        order.id, 
        itemId, 
        assignments[0]?.materialId || undefined, 
        order.businessId,
        metadata
      );

      await this.load3DData(true); // Refresh machine statuses after assign
      this.onSave.emit();
      this.itemToAssignId.set(null);
      this.filamentAssignments.set([{ materialId: '', grams: 0 }]);
    } catch (e: any) {
      console.error('Error starting item production:', e);
      this.confirmService.confirm({
        title: 'Error',
        message: e.error?.message || 'No se pudo iniciar la producción.',
        hideCancel: true,
        type: 'danger'
      });
      this.updatingItemIds.update((ids: Set<string>) => {
        const newIds = new Set(ids);
        newIds.delete(itemId);
        return newIds;
      });
    }
  }

  async handleRemovePayment(paymentId: string) {
    const order = this.order();
    if (!order) return;

    const confirmed = await this.confirmService.confirm({
      title: 'Revertir Cobro',
      message: '¿Estás seguro de que deseas eliminar este registro de cobro? El saldo pendiente se actualizará automáticamente.',
      confirmLabel: 'Revertir',
      type: 'warning'
    });

    if (!confirmed) return;

    this.isSaving.set(true);
    try {
      await this.api.removePayment(order.id, paymentId, order.businessId);
      this.onSave.emit(); 
    } catch (err) {
      console.error('Error removing payment:', err);
      this.confirmService.confirm({
        title: 'Error',
        message: 'No se pudo eliminar el cobro.',
        hideCancel: true,
        type: 'danger'
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  getLabel = getStatusLabel;
  getStyles = getStatusStyles;
  cn = cn;
}

