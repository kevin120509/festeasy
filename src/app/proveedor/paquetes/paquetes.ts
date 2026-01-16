import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { ProviderPackage } from '../../models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PackageItem {
  nombre: string;
  cantidad: number;
}

interface ExtraCharge {
  nombre: string;
  precio: number;
}

interface PackageImage {
  url: string;
  file?: File;
  isPortada: boolean;
}

@Component({
  selector: 'app-paquetes',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './paquetes.html',
  styleUrl: './paquetes.css'
})
export class PaquetesComponent {
  private apiService = inject(ApiService);
  private supabaseService = inject(SupabaseService);
  public authService = inject(AuthService);

  // Paso actual del stepper
  currentStep = signal(1);

  // Estados
  saving = signal(false);
  uploadingImages = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Datos del paquete
  packageData = signal({
    nombre: '',
    categoria_servicio_id: '',
    descripcion: '',
    precio_base: 0,
    estado: 'borrador' as 'borrador' | 'publicado' | 'archivado'
  });

  // Items del inventario
  items = signal<PackageItem[]>([]);
  newItemName = signal('');
  newItemQuantity = signal(1);

  // Cargos adicionales
  extraCharges = signal<ExtraCharge[]>([]);
  newChargeName = signal('');
  newChargePrice = signal(0);

  // Imágenes
  images = signal<PackageImage[]>([]);

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
      this.currentStep.update(step => step - 1);
    }
  }

  // Gestión de items
  addItem() {
    const name = this.newItemName().trim();
    const quantity = this.newItemQuantity();

    if (name && quantity > 0) {
      this.items.update(items => [...items, { nombre: name, cantidad: quantity }]);
      this.newItemName.set('');
      this.newItemQuantity.set(1);
    }
  }

  removeItem(index: number) {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  // Gestión de cargos adicionales
  addExtraCharge() {
    const name = this.newChargeName().trim();
    const price = this.newChargePrice();

    if (name && price > 0) {
      this.extraCharges.update(charges => [...charges, { nombre: name, precio: price }]);
      this.newChargeName.set('');
      this.newChargePrice.set(0);
    }
  }

  removeExtraCharge(index: number) {
    this.extraCharges.update(charges => charges.filter((_, i) => i !== index));
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

    // Validar que no se excedan 10 imágenes
    if (this.images().length + files.length > 10) {
      this.errorMessage.set('Máximo 10 imágenes permitidas');
      return;
    }

    this.uploadingImages.set(true);
    this.errorMessage.set('');

    try {
      for (const file of files) {
        // Validar tipo
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage.set('Las imágenes no deben superar los 5MB');
          continue;
        }

        // Subir a Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `packages/${fileName}`;

        const publicUrl = await this.supabaseService.uploadFile('festeasy', filePath, file);

        // Agregar a la lista de imágenes
        this.images.update(imgs => [
          ...imgs,
          { url: publicUrl, file, isPortada: imgs.length === 0 }
        ]);
      }

      this.successMessage.set('Imágenes subidas exitosamente');
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error uploading images', error);
      this.errorMessage.set('Error al subir las imágenes');
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
      // Si se eliminó la portada, hacer que la primera imagen sea la portada
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
    // Validaciones
    if (!this.packageData().nombre) {
      this.errorMessage.set('El nombre del paquete es obligatorio');
      return;
    }

    if (!this.packageData().categoria_servicio_id) {
      this.errorMessage.set('La categoría es obligatoria');
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

  // Guardar paquete en el backend
  private async savePackage() {
    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      // Preparar datos del paquete con toda la información
      const packageToSave: any = {
        nombre: this.packageData().nombre,
        categoria_servicio_id: this.packageData().categoria_servicio_id,
        descripcion: this.packageData().descripcion,
        precio_base: this.packageData().precio_base,
        estado: this.packageData().estado,
        // Guardar datos adicionales en un campo JSON (si el backend lo soporta)
        // Si el backend no tiene este campo, puedes crear tablas separadas para items e imágenes
        detalles_json: JSON.stringify({
          items: this.items(),
          cargos_adicionales: this.extraCharges(),
          imagenes: this.images().map(img => ({
            url: img.url,
            isPortada: img.isPortada
          })),
          total_estimado: this.totalEstimado
        })
      };

      console.log('📦 Guardando paquete:', packageToSave);

      // Crear el paquete usando Observable
      this.apiService.createProviderPackage(packageToSave).subscribe({
        next: (createdPackage) => {
          console.log('✅ Paquete creado exitosamente:', createdPackage);

          this.successMessage.set(
            this.packageData().estado === 'publicado'
              ? '¡Paquete publicado exitosamente! 🎉'
              : 'Borrador guardado exitosamente ✓'
          );

          this.saving.set(false);

          // Resetear formulario después de 2 segundos
          setTimeout(() => {
            this.resetForm();
          }, 2000);
        },
        error: (err) => {
          console.error('❌ Error al guardar el paquete:', err);

          // Mostrar mensaje de error más específico
          let errorMsg = 'Error al guardar el paquete. ';
          if (err.error?.message) {
            errorMsg += err.error.message;
          } else if (err.status === 401) {
            errorMsg += 'No estás autenticado. Por favor inicia sesión.';
          } else if (err.status === 400) {
            errorMsg += 'Datos inválidos. Verifica la información.';
          } else if (err.status === 500) {
            errorMsg += 'Error del servidor. Intenta más tarde.';
          } else {
            errorMsg += 'Por favor intenta de nuevo.';
          }

          this.errorMessage.set(errorMsg);
          this.saving.set(false);
        }
      });

    } catch (error) {
      console.error('❌ Error inesperado:', error);
      this.errorMessage.set('Error inesperado al guardar el paquete.');
      this.saving.set(false);
    }
  }

  // Resetear formulario
  private resetForm() {
    this.packageData.set({
      nombre: '',
      categoria_servicio_id: '',
      descripcion: '',
      precio_base: 0,
      estado: 'borrador'
    });
    this.items.set([]);
    this.extraCharges.set([]);
    this.images.set([]);
    this.currentStep.set(1);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  // Actualizar campo del paquete
  updateField(field: string, value: any) {
    this.packageData.update(data => ({ ...data, [field]: value }));
  }
}
