import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
    providedIn: 'root'
})
export class ExcelService {

    constructor() { }

    /**
     * Exporta datos a un archivo Excel (.xlsx)
     * @param data Arreglo de objetos con los datos
     * @param fileName Nombre del archivo (sin extensión)
     * @param sheetName Nombre de la hoja
     */
    exportToExcel(data: any[], fileName: string, sheetName: string = 'Datos'): void {
        if (!data || data.length === 0) {
            console.warn('No hay datos para exportar');
            return;
        }

        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const workbook: XLSX.WorkBook = {
            Sheets: { [sheetName]: worksheet },
            SheetNames: [sheetName]
        };

        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, fileName);
    }

    private saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName + '.xlsx';
        link.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            link.remove();
        }, 100);
    }
}
