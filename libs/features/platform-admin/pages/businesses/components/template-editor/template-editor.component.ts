import { Component, OnInit, inject, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlatformAdminService } from '../../../../services/platform-admin.service';
import { LucideAngularModule, X, Save, Plus, Trash2, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-angular';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-template-editor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="close.emit()"></div>
      
      <div class="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <!-- Header -->
        <div class="flex items-center justify-between p-8 border-b border-zinc-900 bg-zinc-900/20">
          <div class="flex items-center gap-4">
            <div [class]="form.get('isEnabled')?.value ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'" class="p-3 rounded-2xl transition-colors">
              <lucide-angular [img]="form.get('isEnabled')?.value ? icons.Eye : icons.EyeOff" class="h-5 w-5"></lucide-angular>
            </div>
            <div>
              <h3 class="text-xl font-black text-white uppercase tracking-tight">Editar Template</h3>
              <p class="text-zinc-500 text-xs font-bold italic">{{ template()?.name }}</p>
            </div>
          </div>
          <button (click)="close.emit()" class="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all">
            <lucide-angular [img]="icons.X" class="h-5 w-5"></lucide-angular>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="p-8 space-y-6">
          <div class="space-y-4">
            <!-- Visibility Toggle -->
            <div class="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-900 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Disponibilidad</span>
                <p class="text-xs font-bold text-zinc-500 italic">Habilita o deshabilita la creación de negocios con este rubro.</p>
              </div>
              <button 
                type="button"
                (click)="form.get('isEnabled')?.setValue(!form.get('isEnabled')?.value)"
                [class]="form.get('isEnabled')?.value ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-zinc-800'"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                <span 
                  [class]="form.get('isEnabled')?.value ? 'translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                ></span>
              </button>
            </div>

            <div>
              <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Nombre del Template</label>
              <input 
                formControlName="name"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 text-sm font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            <div>
              <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Descripción</label>
              <textarea 
                formControlName="description"
                rows="3"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 text-sm font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
              ></textarea>
            </div>

            <div>
              <div class="flex items-center justify-between mb-4">
                <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Capacidades por Defecto</label>
                <div class="flex gap-2">
                   <select #newCap class="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-[10px] font-black text-zinc-300 outline-none">
                      <option *ngFor="let c of availableCapabilities" [value]="c">{{ c }}</option>
                   </select>
                   <button 
                     type="button"
                     (click)="addCapability(newCap.value)"
                     class="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                   >
                     <lucide-angular [img]="icons.Plus" class="h-4 w-4"></lucide-angular>
                   </button>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-900 min-h-[60px]">
                <div *ngFor="let cap of capabilities; let i = index" class="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl animate-in fade-in duration-300">
                   <span class="text-[10px] font-black text-zinc-200 uppercase tracking-tight">{{ cap }}</span>
                   <button (click)="removeCapability(i)" type="button" class="text-zinc-500 hover:text-rose-500 transition-colors">
                      <lucide-angular [img]="icons.Trash2" class="h-3 w-3"></lucide-angular>
                   </button>
                </div>
                <p *ngIf="capabilities.length === 0" class="text-[10px] text-zinc-600 font-bold italic w-full text-center py-2">Sin capacidades configuradas</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-4 pt-4">
             <button 
              type="button"
              (click)="close.emit()"
              class="flex-1 px-8 py-4 bg-zinc-900 text-zinc-400 rounded-2xl hover:bg-zinc-800 transition-all text-xs font-black uppercase tracking-widest border border-zinc-800"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              [disabled]="form.invalid || loading()"
              class="flex-2 flex items-center justify-center gap-2 px-12 py-4 bg-primary text-white rounded-2xl hover:bg-primary-hover transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <lucide-angular [img]="loading() ? icons.Loader2 : icons.Save" [class.animate-spin]="loading()" class="h-4 w-4"></lucide-angular>
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class TemplateEditorModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(PlatformAdminService);
  private toast = inject(ToastService);

  readonly template = input<any>();
  readonly close = output<void>();
  readonly updated = output<void>();

  readonly icons = { X, Save, Plus, Trash2, Loader2, ShieldCheck, Eye, EyeOff };

  form!: FormGroup;
  loading = signal(false);
  capabilities: string[] = [];

  readonly availableCapabilities = [
    'PRODUCTION_MANAGEMENT',
    'PRODUCTION_MACHINES',
    'INVENTORY_RAW',
    'INVENTORY_RETAIL',
    'SALES_MANAGEMENT',
    'SALES_BASIC',
    'FINANCIAL_BASIC',
    'CALENDAR_ADVANCED',
    'TEAM_MANAGEMENT',
    'VISITS_MANAGEMENT'
  ];

  constructor() {
    LucideAngularModule.pick(this.icons);
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      isEnabled: [true]
    });
  }

  ngOnInit() {
    const t = this.template();
    if (t) {
      this.form.patchValue({
        name: t.name,
        description: t.description,
        isEnabled: t.isEnabled
      });
      this.capabilities = [...(t.defaultCapabilities || [])];
    }
  }

  addCapability(cap: string) {
    if (!cap || this.capabilities.includes(cap)) return;
    this.capabilities.push(cap);
  }

  removeCapability(index: number) {
    this.capabilities.splice(index, 1);
  }

  async save() {
    if (this.form.invalid) return;

    try {
      this.loading.set(true);
      const data = {
        ...this.form.value,
        defaultCapabilities: this.capabilities
      };
      
      await this.adminService.updateTemplate(this.template().key, data);
      this.toast.success('Template actualizado correctamente');
      this.updated.emit();
      this.close.emit();
    } catch (e: any) {
      this.toast.error('Error al actualizar template');
    } finally {
      this.loading.set(false);
    }
  }
}
