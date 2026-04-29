import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { CacheService } from '../cache/cache.service';
import { Negocio, Rubro, NegocioConfig, UserProfile, BusinessConfig } from '../../shared/models';
import { BusinessContextService } from './business-context.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, firstValueFrom } from 'rxjs';
import { getNegocioConfig, mapCategoryToRubro } from '../../shared/utils';
import { STORAGE_KEYS, APP_CONFIG } from '../../shared/constants';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private cache = inject(CacheService);
  private context = inject(BusinessContextService);

  // Signals for holding state
  private _user = signal<UserProfile | null>(null);
  user = computed(() => this._user());

  private _negocios = signal<Negocio[]>([]);
  negocios = computed(() => this._negocios());

  private _activeId = signal<string | null>(null);
  activeId = computed(() => this._activeId());

  // New Dynamic Module Config
  businessConfig = signal<BusinessConfig | null>(null);
  activeSubscription = computed(() => this.businessConfig()?.['subscription']);
  
  // Plan usage tracking
  planUsage = signal<import('../../shared/models').PlanUsage | null>(null);

  activeNegocio = computed(() => {
    const id = this._activeId();
    if (!id) return null;
    return this._negocios().find(n => n.id === id) || null;
  });

  isInitialized = signal(false);
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  // La configuración se extrae del businessConfig dinámico si existe, sino cae al local
  config = computed<NegocioConfig>(() => 
    this.businessConfig()?.config || getNegocioConfig(this.activeNegocio()?.rubro || APP_CONFIG.DEFAULT_RUBRO)
  );

  // Rubro del negocio activo para fácil acceso
  rubro = computed<Rubro>(() => 
    this.activeNegocio()?.rubro || APP_CONFIG.DEFAULT_RUBRO
  );

  activeCapabilities = computed<string[]>(() => 
    this.activeNegocio()?.capabilities || []
  );

  hasCapability(capability: string): boolean {
    return this.activeCapabilities().includes(capability);
  }

  private lastUserId: string | null = null;

  constructor() {
    // Reaccionar al cambio de sesión de forma proactiva
    effect(() => {
      const session = this.auth.session();
      if (session) {
        if (this.lastUserId !== session.user.id) {
          console.log('[SessionService] Session changed from', this.lastUserId, 'to', session.user.id);
          this.clearSession(); // Wipe before re-init
          this.lastUserId = session.user.id;
          this.initialize();
        }
      } else {
        this.clearSession();
      }
    });
  }

  /**
   * Returns a promise that resolves when the session is fully initialized.
   * Useful for guards. If already initialized, it returns immediately.
   */
  async waitUntilInitialized(): Promise<void> {
    if (this.isInitialized()) return;
    
    // If not initialized but we have a session, call initialize() which handles deduplication
    const session = this.auth.session();
    if (session) {
      await this.initialize();
      return;
    }
    
    // If no session, wait a bit for signals to resolve or just return if we are sure
    // We already have a computed/signal system, so firstValueFrom on isInitialized is a good fallback
    await firstValueFrom(
      toObservable(this.isInitialized).pipe(
        filter(init => init === true),
        take(1)
      )
    );
  }

  private clearSession() {
    console.log('[SessionService] Clearing session');
    this.lastUserId = null;
    this._user.set(null);
    this._negocios.set([]);
    this._activeId.set(null);
    this.isInitialized.set(false);
    this.businessConfig.set(null);
    this.initPromise = null;
    this.isInitializing = false;
    this.cache.clearAll();
  }

  /**
   * Main initialization logic. 
   * Fetches user profile, businesses, and selects the active business.
   */
  public async initialize(): Promise<void> {
    const session = this.auth.session();
    
    // Safety: if no session, we can't initialize
    if (!session) {
       this.clearSession();
       return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      console.log('[SessionService] Starting initialization...');
      this.isInitializing = true;
      this.isInitialized.set(false);

      try {
        // 1. Fetch Profile
        const profile = await this.api.users.getMe();
        console.log('[SessionService] Profile loaded:', profile.email);
        this._user.set(profile);

        // 2. Fetch Businesses
        const businesses = await this.api.businesses.getAll();
        console.log('[SessionService] Businesses loaded:', businesses.length);
        const mapped: Negocio[] = businesses.map(b => {
          const rubro = mapCategoryToRubro(b.category || b.rubro);
          return {
            id: b.id,
            nombre: b.name || b.nombre,
            rubro: rubro,
            moneda: b.currency || b.moneda || APP_CONFIG.DEFAULT_CURRENCY,
            status: b.status,
            phone: b.phone,
            email: b.email,
            subscriptionExpiresAt: b.subscriptionExpiresAt,
            createdAt: b.createdAt,
            userRole: b.userRole,
            plan: b.plan,
            capabilities: this.resolveCapabilities(rubro, b.capabilities || []),
            config: getNegocioConfig(rubro)
          };
        });
        this._negocios.set(mapped);

        // 3. Selection Logic
        let activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_BUSINESS_ID);

        // Validate stored ID exists in fetched list
        if (activeId && !mapped.some(n => n.id === activeId)) {
          activeId = null;
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_BUSINESS_ID);
        }

        // Auto-select if none selected
        if (!activeId) {
          if (profile.defaultBusinessId && mapped.some(n => n.id === profile.defaultBusinessId)) {
            activeId = profile.defaultBusinessId;
          } else if (mapped.length === 1) {
            activeId = mapped[0].id;
          }
        }

        if (activeId) {
          await this.setActiveId(activeId);
        }

        this.isInitialized.set(true);
        console.log('[SessionService] Initialization complete');
      } catch (error) {
        console.error('[SessionService] Initialization failed:', error);
        this.isInitialized.set(true);
      } finally {
        this.isInitializing = false;
        this.initPromise = null; // Allow re-initialization
      }
    })();

    return this.initPromise;
  }

  /**
   * Determines the best route after login based on current state.
   */
  public getPostLoginRedirect(returnUrl: string = '/dashboard'): string {
    const user = this._user();
    if (!user) return '/login';

    // 1. Super Admin Priority
    if (user.globalRole === 'SUPER_ADMIN') {
      return '/admin';
    }

    // 2. Restricted Users
    if (user.status === 'BLOCKED') {
      return '/login?error=ACCOUNT_BLOCKED';
    }

    if (user.status === 'PENDING') {
      return '/waiting-room';
    }

    // 3. Active User Logic
    const businesses = this._negocios();
    const active = this.activeNegocio();

    if (businesses.length === 0) {
      return '/onboarding';
    }

    if (active) {
      // If we have a returnUrl that isn't login/onboarding, respect it
      if (returnUrl && returnUrl !== '/' && returnUrl !== '/login' && returnUrl !== '/onboarding') {
        return returnUrl;
      }
      return '/dashboard';
    }

    return '/select-business';
  }

  private resolveCapabilities(rubro: Rubro, existing: string[]): string[] {
    // Return existing from DB as is, no hardcoded injections
    return Array.from(new Set(existing || []));
  }

  async addNegocio(name: string, templateKey: string, phone?: string, email?: string, metadata?: any) {
    const newBusiness = await this.api.businesses.create({ 
      name, 
      templateKey,
      ...(phone && { phone }),
      ...(email && { email }),
      ...(metadata && { metadata })
    });
    await this.initialize();
    return newBusiness;
  }

  async updateNegocio(id: string, data: any) {
    const updated = await this.api.businesses.update(id, data);
    await this.initialize();
    return updated;
  }

  async removeNegocio(id: string) {
    await this.api.businesses.delete(id);
    if (this._activeId() === id) {
      this._activeId.set(null);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_BUSINESS_ID);
    }
    await this.initialize();
  }

  async setActiveId(id: string) {
    this._activeId.set(id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS_ID, id);
    this.context.setBusinessId(id);
    this.cache.clearAll();
    
    // Load dynamic config for the selected business
    await this.loadBusinessConfig(id);
    
    // Only update default in server if it actually changed to save traffic
    const userProfile = this._user();
    if (userProfile && userProfile.defaultBusinessId !== id) {
       this.api.users.setDefaultBusiness(id).catch(() => {});
    }
  }

  private async loadBusinessConfig(id: string) {
    try {
      const [config, usage] = await Promise.all([
        this.api.businesses.getConfig(id),
        this.api.businesses.getPlanUsage(id)
      ]);
      
      this.businessConfig.set(config);
      this.planUsage.set(usage);
      
      console.log('[SessionService] Business Context loaded. Plan:', usage.plan.name);
    } catch (error) {
      console.error('[SessionService] Failed to load business config:', error);
      this.businessConfig.set(null);
      this.planUsage.set(null);
    }
  }

  /**
   * Refreshes usage data from server
   */
  async refreshPlanUsage() {
    const id = this._activeId();
    if (!id) return;
    try {
      const usage = await this.api.businesses.getPlanUsage(id);
      this.planUsage.set(usage);
    } catch (e) {
      console.error('[SessionService] Failed to refresh usage', e);
    }
  }
}
