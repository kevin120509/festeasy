import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SubscriptionService } from '../../services/subscription.service';
import { ConfirmationService } from 'primeng/api';
import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Paquete {
  id: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  estado: 'publicado' | 'borrador' | 'archivado';
  detalles_json?: any;
  creado_en: string;
  actualizado_en: string;
  vistas?: number;
  reservas?: number;
}

interface PackageItem {
  nombre_item: string;
  cantidad: number;
  unidad?: string;
}

interface ExtraCharge {
  nombre: string;
  precio: number;
  descripcion: string;
}

interface PackageImage {
  url: string;
  file?: File;
  isPortada: boolean;
}

@Component({
  selector: 'app-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './paquetes.html',
  styleUrl: './paquetes.css'
})
export class PaquetesComponent implements OnInit {
  private supabaseData = inject(SupabaseDataService);
  private supabaseService = inject(SupabaseService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private confirmationService = inject(ConfirmationService);
  public subscriptionService = inject(SubscriptionService);

  // Paquetes
  paquetes = signal<Paquete[]>([]);

  // Loading state
  loading = signal(false);

  // Vista actual: 'lista' o 'crear' o 'editar'
  vistaActual = signal<'lista' | 'crear' | 'editar'>('lista');

  // Perfil del proveedor
  profile: any = null;

  // Tab activo: publicado, borrador, archivado
  tabActivo = signal<'publicado' | 'borrador' | 'archivado'>('publicado');

  // Paquete en edición
  paqueteEditando = signal<Paquete | null>(null);

  // Menú contextual
  menuAbierto = signal<string | null>(null);

  // Filtros
  paquetesActivos = computed(() =>
    this.paquetes().filter(p => p.estado === 'publicado')
  );

  paquetesBorradores = computed(() =>
    this.paquetes().filter(p => p.estado === 'borrador')
  );

  paquetesArchivados = computed(() =>
    this.paquetes().filter(p => p.estado === 'archivado')
  );

  paquetesFiltrados = computed(() => {
    const tab = this.tabActivo();
    switch (tab) {
      case 'publicado': return this.paquetesActivos();
      case 'borrador': return this.paquetesBorradores();
      case 'archivado': return this.paquetesArchivados();
      default: return this.paquetes();
    }
  });

  // ⭐ Signal computado para validar si puede crear más paquetes según su plan
  canCreate = computed(() =>
    this.subscriptionService.canCreatePackage(this.paquetes().length)
  );

  // Paso actual del stepper (para crear/editar)
  currentStep = signal(1);

  // Estados
  saving = signal(false);
  uploadingImages = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Datos del paquete
  packageData = signal({
    nombre: '',
    descripcion: '',
    precio_base: 0,
    categoria_servicio_id: '' as string,
    estado: 'publicado' as 'borrador' | 'publicado' | 'archivado'
  });

  // Categorías disponibles
  categorias = signal<any[]>([]);

  // Items del paquete (elementos incluidos)
  packageItems = signal<PackageItem[]>([]);
  newItemName = signal('');
  newItemQuantity = signal(1);
  newItemUnit = signal('');

  // Cargos adicionales
  extraCharges = signal<ExtraCharge[]>([]);
  newChargeName = signal('');
  newChargePrice = signal(0);
  newChargeDescription = signal('');

  // Imágenes
  images = signal<PackageImage[]>([]);

  async ngOnInit() {
    await this.cargarPerfil();
    await this.cargarCategorias();
    await this.cargarPaquetes();

    // Verificar si hay un query param para editar después de cargar los paquetes
    this.route.queryParams.subscribe(params => {
      const editarId = params['editar'];
      if (editarId && this.paquetes().length > 0) {
        const paquete = this.paquetes().find(p => p.id === editarId);
        if (paquete) {
          setTimeout(() => {
            this.editarPaquete(paquete);
          }, 100);
        }
      }
    });
  }

  async cargarCategorias() {
    try {
      const categorias = await this.supabaseData.getServiceCategories();
      this.categorias.set(categorias);

      // Si hay categorías y no hay una seleccionada, seleccionar la primera
      if (categorias.length > 0 && !this.packageData().categoria_servicio_id) {
        this.packageData.update(data => ({ ...data, categoria_servicio_id: categorias[0].id }));
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  }

  async cargarPaquetes() {
    this.loading.set(true);
    try {
      if (!this.profile) {
        console.error('Perfil no cargado');
        return;
      }

      const { data, error } = await this.supabaseService.getClient()
        .from('paquetes_proveedor')
        .select(`
          *,
          items_paquete (*)
        `)
        .eq('proveedor_usuario_id', this.profile.usuario_id)
        .order('creado_en', { ascending: false });

      if (error) throw error;

      this.paquetes.set(data || []);
    } catch (error: any) {
      console.error('Error cargando paquetes:', error);
      this.errorMessage.set('Error al cargar paquetes: ' + error.message);
    } finally {
      this.loading.set(false);
    }
  }

  async cargarPerfil() {
    try {
      const userId = this.authService.currentUser()?.id;
      if (!userId) {
        console.error('Usuario no autenticado');
        return;
      }
      const profile = await this.api.getProviderProfile(userId).toPromise();
      this.profile = profile;
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }

  // Cambiar tab - FIXED: usando notación de corchetes para TS4111
  cambiarTab(tab: 'publicado' | 'borrador' | 'archivado') {
    this.tabActivo.set(tab);
    this.menuAbierto.set(null);
  }

  // Toggle menú contextual
  toggleMenu(paqueteId: string) {
    if (this.menuAbierto() === paqueteId) {
      this.menuAbierto.set(null);
    }
    else {
      this.menuAbierto.set(paqueteId);
    }
  }

  // Cerrar menú
  cerrarMenu() {
    this.menuAbierto.set(null);
  }

  // Cambiar estado del paquete (toggle online/offline)
  async toggleEstado(paquete: Paquete) {
    const nuevoEstado = paquete.estado === 'publicado' ? 'archivado' : 'publicado';

    try {
      const { error } = await this.supabaseService.getClient()
        .from('paquetes_proveedor')
        .update({ estado: nuevoEstado })
        .eq('id', paquete.id);

      if (error) throw error;

      // Actualizar localmente
      this.paquetes.update(paquetes =>
        paquetes.map(p => p.id === paquete.id ? { ...p, estado: nuevoEstado } : p)
      );

      this.successMessage.set(`Paquete ${nuevoEstado === 'publicado' ? 'activado' : 'archivado'} exitosamente`);
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error: any) {
      this.errorMessage.set('Error al cambiar estado: ' + error.message);
    }
  }

  // Eliminar paquete
  async eliminarPaquete(paquete: Paquete) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el paquete "${paquete.nombre}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: async () => {
        try {
          const { error } = await this.supabaseService.getClient()
            .from('paquetes_proveedor')
            .delete()
            .eq('id', paquete.id);

          if (error) throw error;

          // Eliminar localmente
          this.paquetes.update(paquetes => paquetes.filter(p => p.id !== paquete.id));

          this.successMessage.set('Paquete eliminado exitosamente');
          setTimeout(() => this.successMessage.set(''), 3000);
        } catch (error: any) {
          this.errorMessage.set('Error al eliminar: ' + error.message);
        }
        this.menuAbierto.set(null);
      }
    });
  }

  // Editar paquete
  editarPaquete(paquete: Paquete) {
    this.paqueteEditando.set(paquete);
    this.menuAbierto.set(null);

    // Cargar datos en el formulario
    this.packageData.set({
      nombre: paquete.nombre,
      descripcion: paquete.descripcion,
      precio_base: paquete.precio_base,
      categoria_servicio_id: (paquete as any).categoria_servicio_id || '',
      estado: paquete.estado
    });

    // Cargar detalles JSON si existe
    if (paquete.detalles_json) {
      this.extraCharges.set(paquete.detalles_json.cargos_adicionales || []);

      if (paquete.detalles_json.imagenes) {
        this.images.set(paquete.detalles_json.imagenes.map((img: any) => ({
          url: img.url,
          isPortada: img.isPortada
        })));
      }
    }

    // Cargar items del paquete si existen
    if ((paquete as any).items_paquete) {
      this.packageItems.set((paquete as any).items_paquete);
    }

    this.currentStep.set(1);
    this.vistaActual.set('editar');
  }

  // Crear nuevo paquete
  crearNuevo() {
    this.resetForm();
    this.paqueteEditando.set(null);
    this.vistaActual.set('crear');
  }

  // Volver a la lista
  volverALista() {
    this.vistaActual.set('lista');
    this.resetForm();
    this.cargarPaquetes();
  }

  // Computed: Total estimado
  get totalEstimado(): number {
    const base = this.packageData().precio_base || 0;
    const extras = this.extraCharges().reduce((sum, charge) => sum + charge.precio, 0);
    return base + extras;
  }

  // Helper: Obtener imagen de portada
  get portadaImage(): PackageImage | undefined {
    return this.images().find(img => img.isPortada);
  }

  // Helper: Obtener URL de imagen de portada
  get portadaUrl(): string | undefined {
    return this.portadaImage?.url;
  }

  // Helper: Obtener imagen de paquete
  getPackageImage(paquete: Paquete): string {
    if (paquete.detalles_json?.imagenes?.length > 0) {
      const portada = paquete.detalles_json.imagenes.find((img: any) => img.isPortada);
      return portada?.url || paquete.detalles_json.imagenes[0].url;
    }
    return 'assets/placeholder-package.png';
  }

  // Navegación entre pasos
  goToStep(step: number) {
    if (step >= 1 && step <= 4) {
      this.currentStep.set(step);
    }
  }

  nextStep() {
    if (this.currentStep() < 4) {
      this.currentStep.update(step => step + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step + 1);
    }
  }

  // Gestión de cargos adicionales
  addExtraCharge() {
    const name = this.newChargeName().trim();
    const price = this.newChargePrice();
    const description = this.newChargeDescription().trim();

    if (name && price > 0) {
      this.extraCharges.update(charges => [...charges, { nombre: name, precio: price, descripcion: description }]);
      this.newChargeName.set('');
      this.newChargePrice.set(0);
      this.newChargeDescription.set('');
    }
  }

  removeExtraCharge(index: number) {
    this.extraCharges.update(charges => charges.filter((_, i) => i !== index));
  }

  // Gestión de items del paquete
  addPackageItem() {
    const name = this.newItemName().trim();
    const quantity = this.newItemQuantity();
    const unit = this.newItemUnit().trim();

    if (name && quantity > 0) {
      this.packageItems.update(items => [...items, { 
        nombre_item: name, 
        cantidad: quantity, 
        unidad: unit || 'unidad(es)' 
      }]);
      this.newItemName.set('');
      this.newItemQuantity.set(1);
      this.newItemUnit.set('');
    }
  }

  removePackageItem(index: number) {
    this.packageItems.update(items => items.filter((_, i) => i !== index));
  }

  // Gestión de imágenes
  async onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const userId = this.authService.currentUser()?.id;

    if (!userId) {
      this.errorMessage.set('No se pudo obtener el usuario actual');
      return;
    }

    if (this.images().length + files.length > 10) {
      this.errorMessage.set('Máximo 10 imágenes permitidas');
      return;
    }

    this.uploadingImages.set(true);
    this.errorMessage.set('');

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage.set('Las imágenes no deben superar los 5MB');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `packages/${fileName}`;

        const publicUrl = await this.supabaseService.uploadFile('festeasy', filePath, file);

        this.images.update(imgs => [
          ...imgs,
          { url: publicUrl, file, isPortada: imgs.length === 0 }
        ]);
      }

      this.successMessage.set('Imágenes subidas exitosamente');
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error: any) {
      console.error('Error uploading images', error);
      this.errorMessage.set(`Error al subir imagen: ${error.message || 'Error desconocido'}`);
    } finally {
      this.uploadingImages.set(false);
    }
  }

  setPortada(index: number) {
    this.images.update(imgs =>
      imgs.map((img, i) => ({ ...img, isPortada: i === index }))
    );
  }

  removeImage(index: number) {
    this.images.update(imgs => {
      const newImgs = imgs.filter((_, i) => i !== index);
      if (newImgs.length > 0 && !newImgs.some(img => img.isPortada)) {
        newImgs[0].isPortada = true;
      }
      return newImgs;
    });
  }

  // Guardar borrador
  async guardarBorrador() {
    this.packageData.update(data => ({ ...data, estado: 'borrador' }));
    await this.savePackage();
  }

  // Publicar paquete
  async publicar() {
    if (!this.packageData().nombre) {
      this.errorMessage.set('El nombre del paquete es obligatorio');
      return;
    }

    if (this.packageData().precio_base <= 0) {
      this.errorMessage.set('El precio base debe ser mayor a 0');
      return;
    }

    if (this.images().length === 0) {
      this.errorMessage.set('Debes subir al menos una imagen');
      return;
    }

    this.packageData.update(data => ({ ...data, estado: 'publicado' }));
    await this.savePackage();
  }

  // Guardar paquete
  private async savePackage() {
    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validaciones
    if (!this.profile) {
      await this.cargarPerfil();
      if (!this.profile) {
        this.errorMessage.set('No se pudo cargar tu perfil de proveedor. Por favor, intenta recargar la página.');
        this.saving.set(false);
        return;
      }
    }

    if (!this.packageData().nombre.trim()) {
      this.errorMessage.set('El nombre del paquete es obligatorio');
      this.saving.set(false);
      return;
    }
    if (this.packageData().precio_base <= 0) {
      this.errorMessage.set('El precio base debe ser mayor a 0');
      this.saving.set(false);
      return;
    }

    // ⭐ Validación de categoría (CRÍTICO para Supabase)
    if (!this.packageData().categoria_servicio_id || this.packageData().categoria_servicio_id.trim() === '') {
      this.errorMessage.set('⚠️ Debes seleccionar una categoría de servicio antes de guardar');
      this.saving.set(false);
      return;
    }

    try {
      const packageToSave: any = {
        proveedor_usuario_id: this.profile.usuario_id,
        categoria_servicio_id: this.packageData().categoria_servicio_id, // ⭐ CAMPO REQUERIDO
        nombre: this.packageData().nombre,
        descripcion: this.packageData().descripcion,
        precio_base: this.packageData().precio_base,
        estado: 'publicado',
        detalles_json: {
          cargos_adicionales: this.extraCharges(),
          imagenes: this.images().map(img => ({
            url: img.url,
            isPortada: img.isPortada
          })),
          total_estimado: this.totalEstimado
        }
      };

      console.log('👤 User ID:', this.authService.currentUser()?.id);
      console.log('📦 Package to save:', packageToSave);

      if (this.paqueteEditando()) {
        // Actualizar paquete existente
        const { error } = await this.supabaseService.getClient()
          .from('paquetes_proveedor')
          .update(packageToSave)
          .eq('id', this.paqueteEditando()!.id);

        if (error) throw error;

        // Actualizar items del paquete usando el servicio
        await this.supabaseData.updatePackageItems(
          this.paqueteEditando()!.id, 
          this.packageItems()
        );

        this.successMessage.set('¡Paquete actualizado exitosamente! 🎉');
      } else {
        // Crear nuevo paquete
        const createdPackage = await this.supabaseData.createProviderPackage(packageToSave);
        
        // Insertar items del paquete usando el servicio
        if (this.packageItems().length > 0 && createdPackage?.id) {
          await this.supabaseData.createPackageItems(
            createdPackage.id,
            this.packageItems()
          );
        }

        const estado = this.packageData().estado;
        this.successMessage.set(
          estado === 'publicado'
            ? '¡Paquete publicado exitosamente! 🎉'
            : 'Borrador guardado exitosamente ✓'
        );
      }

      this.saving.set(false);

      // Volver a la lista después de 2 segundos
      setTimeout(() => {
        this.volverALista();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error al guardar el paquete:', error);
      let errorMsg = 'Error al guardar el paquete. ';
      if (error.message) {
        errorMsg += error.message;
      }
      this.errorMessage.set(errorMsg);
      this.saving.set(false);
    }
  }

  // Resetear formulario
  private resetForm() {
    // Mantener la primera categoría seleccionada si existe
    const defaultCategoriaId = this.categorias().length > 0 ? this.categorias()[0].id : '';

    this.packageData.set({
      nombre: '',
      descripcion: '',
      precio_base: 0,
      categoria_servicio_id: defaultCategoriaId,
      estado: 'publicado'
    });
    this.packageItems.set([]);
    this.extraCharges.set([]);
    this.images.set([]);
    this.currentStep.set(1);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.paqueteEditando.set(null);
  }

  // Actualizar campo del paquete
  updateField(field: string, value: any) {
    this.packageData.update(data => ({ ...data, [field]: value }));
  }

  // Ver detalle del paquete
  verDetallePaquete(paquete: Paquete) {
    this.router.navigate(['/proveedor/paquete', paquete.id]);
  }
}
