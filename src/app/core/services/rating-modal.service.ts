import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RatingModalComponent } from '../../components/common/rating-modal.component';

/**
 * Servicio para abrir el modal de calificación de forma programática
 */
@Injectable({
    providedIn: 'root'
})
export class RatingModalService {
    public dialog = inject(MatDialog);

    /**
     * Abre el modal de calificación
     * 
     * @param solicitudId - ID de la solicitud a calificar
     * @param destinatarioId - ID del proveedor (destinatario de la reseña)
     * @returns Promise que se resuelve cuando el modal se cierra
     */
    open(solicitudId: string, destinatarioId: string): Promise<any> {
        const dialogRef = this.dialog.open(RatingModalComponent, {
            width: '400px',
            data: {
                solicitud_id: solicitudId,
                destinatario_id: destinatarioId
            },
            disableClose: true
        });

        console.log('🎭 Modal de calificación abierto');

        return dialogRef.afterClosed().toPromise();
    }

    /**
     * Cierra todos los modales abiertos
     */
    close(): void {
        this.dialog.closeAll();
        console.log('🎭 Modal de calificación cerrado');
    }
}
