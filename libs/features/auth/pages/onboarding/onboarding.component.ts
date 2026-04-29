import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '@core/session/session.service';
import { AuthService } from '@core/auth/auth.service';
import { ApiService } from '@core/api/api.service';
import { LucideAngularModule, Building2, AlertCircle, Mail, Loader2, ChevronRight, Zap, Target, Hammer, ShoppingCart, CheckCircle2, ChevronDown, Search } from 'lucide-angular';
import { ButtonSpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonSpinnerComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css']
})
export class OnboardingComponent implements OnInit {
  private session = inject(SessionService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private api = inject(ApiService);

  readonly icons = { Building2, AlertCircle, Mail, Loader2, ChevronRight, Zap, Target, Hammer, ShoppingCart, CheckCircle2, ChevronDown, Search };

  // UI State
  step = signal<'WELCOME' | 'CHOOSE_TEMPLATE' | 'CREATING'>('WELCOME');
  templates = signal<any[]>([]);
  loadingTemplates = signal(false);
  selectedTemplate = signal<any | null>(null);
  
  // Creation state
  businessName = signal('');
  businessPhone = signal('');
  businessEmail = signal('');
  businessCountry = signal('AR');
  businessProvince = signal('');
  isCreating = signal(false);

  // Dropdown States
  showCountryDropdown = signal(false);
  showProvinceDropdown = signal(false);
  provinceSearch = signal('');

  countries = [
    { code: 'AR', name: 'Argentina', prefix: '+54' },
    { code: 'UY', name: 'Uruguay', prefix: '+598' },
    { code: 'CL', name: 'Chile', prefix: '+56' },
    { code: 'PY', name: 'Paraguay', prefix: '+595' },
    { code: 'BO', name: 'Bolivia', prefix: '+591' },
    { code: 'BR', name: 'Brasil', prefix: '+55' },
    { code: 'ES', name: 'España', prefix: '+34' },
    { code: 'MX', name: 'México', prefix: '+52' },
    { code: 'CO', name: 'Colombia', prefix: '+57' },
    { code: 'PE', name: 'Perú', prefix: '+51' },
  ];

  provinces = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
  ];

  filteredProvinces = computed(() => {
    const s = this.provinceSearch().toLowerCase();
    if (!s) return this.provinces;
    return this.provinces.filter(p => p.toLowerCase().includes(s));
  });

  selectedCountryName = computed(() => {
    return this.countries.find(c => c.code === this.businessCountry())?.name || 'Selecciona País';
  });

  selectedCountryPrefix = computed(() => {
    const c = this.countries.find(curr => curr.code === this.businessCountry());
    return c?.prefix || '';
  });

  // Validations
  isValidEmail = computed(() => {
    const email = this.businessEmail();
    if (!email) return true; // Optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });

  isValidPhone = computed(() => {
    const phone = this.businessPhone();
    if (!phone) return true; // Optional
    // Basic digits check after prefix
    return /^\d{7,15}$/.test(phone.replace(/\s/g, ''));
  });

  canCreate = computed(() => {
    return this.businessName().length >= 3 && 
           this.isValidEmail() && 
           this.isValidPhone() &&
           this.businessProvince().length > 0;
  });

  userEmail = computed(() => this.auth.session()?.user.email || 'Usuario');
  negocios = computed(() => this.session.negocios());

  ngOnInit() {
    // Si ya tiene negocios, redirigir
    if (this.session.isInitialized() && this.negocios().length > 0) {
      this.router.navigate(['/dashboard']);
    }
  }

  async startOnboarding() {
    this.step.set('CHOOSE_TEMPLATE');
    await this.loadTemplates();
  }

  async loadTemplates() {
    this.loadingTemplates.set(true);
    try {
      const data = await this.api.businesses.getTemplates();
      this.templates.set(data);
    } catch (err) {
      console.error('[Onboarding] Error loading templates:', err);
    } finally {
      this.loadingTemplates.set(false);
    }
  }

  selectTemplate(template: any) {
    this.selectedTemplate.set(template);
    // Auto-set business name if empty
    if (!this.businessName()) {
      this.businessName.set(`${template.name} de ${this.userEmail().split('@')[0]}`);
    }
  }

  async createBusiness() {
    if (!this.selectedTemplate() || this.isCreating() || !this.canCreate()) return;
    
    this.isCreating.set(true);
    try {
      const fullPhone = `${this.selectedCountryPrefix()} ${this.businessPhone()}`;
      
      await this.session.addNegocio(
        this.businessName(), 
        this.selectedTemplate().key,
        fullPhone,
        this.businessEmail(),
        {
          country: this.businessCountry(),
          province: this.businessProvince()
        }
      );
      this.step.set('CREATING');
      
      // Short delay for the "Success" animation before redirecting
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);
    } catch (err) {
      console.error('[Onboarding] Error creating business:', err);
      this.isCreating.set(false);
    }
  }

  back() {
    if (this.step() === 'CHOOSE_TEMPLATE') {
      this.step.set('WELCOME');
    }
  }

  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('[Onboarding] Error during logout:', err);
    }
  }
}
