import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Producto } from '../../../models';
import { InventoryService } from '../../../services/inventory.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-producto-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        TextareaModule,
        CheckboxModule
    ],
    templateUrl: './producto-form.component.html'
})
export class ProductoFormComponent {
    private fb = inject(FormBuilder);
    private inventoryService = inject(InventoryService);
    private messageService = inject(MessageService);

    @Input() visible = false;
    @Input() set producto(p: Producto | null) {
        this._producto = p;
        if (p) {
            this.form.patchValue(p);
        } else {
            this.form.reset({ stock: 0, precio_unitario: 0, destacado: false });
        }
    }
    @Output() onSave = new EventEmitter<Producto>();
    @Output() onCancel = new EventEmitter<void>();

    public _producto: Producto | null = null;
    isLoading = signal(false);

    form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        categoria: [''],
        descripcion: [''],
        precio_unitario: [0, [Validators.required, Validators.min(0)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        destacado: [false]
    });



    save() {
        if (this.form.invalid) return;

        this.isLoading.set(true);
        const data = {
            ...this.form.value
        } as Partial<Producto>;

        const obs = this._producto
            ? this.inventoryService.updateProducto(this._producto.id, data)
            : this.inventoryService.createProducto(data);

        obs.subscribe({
            next: (res) => {
                this.isLoading.set(false);
                if (res) {
                    this.onSave.emit(res);
                    this.close();
                }
            },
            error: (err) => {
                console.error('Error saving product:', err);
                this.isLoading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el producto' });
            }
        });
    }

    close() {
        this.onCancel.emit();
    }
}
