import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-finanzas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ChartModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputNumberModule,
        InputTextModule,
        DatePickerModule,
        SelectModule,
        TextareaModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './finanzas.html',
    styleUrl: './finanzas.css'
})
export class FinanzasComponent implements OnInit {
    private api = inject(ApiService);
    private messageService = inject(MessageService);

    // Stats
    summary = signal<any>({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        eventCount: 0,
        avgTicket: 0
    });

    // Data
    expenses = signal<any[]>([]);
    loading = signal(false);
    isSaving = signal(false);

    // Charts
    chartData: any;
    chartOptions: any;

    // Dialogs
    showExpenseDialog = signal(false);
    editingExpense = signal<any>(null);
    expenseForm = {
        monto: 0,
        fecha: new Date(),
        categoria: '',
        nota: ''
    };

    categorias = [
        { label: 'Transporte', value: 'transporte' },
        { label: 'Personal', value: 'personal' },
        { label: 'Material', value: 'material' },
        { label: 'Renta', value: 'renta' },
        { label: 'Otros', value: 'otros' }
    ];

    // Filters
    dateRange: Date[] = [new Date(), new Date()];

    ngOnInit() {
        this.loadData();
        this.initChart();
    }

    loadData() {
        this.loading.set(true);
        const start = this.dateRange[0]?.toISOString().split('T')[0];
        const end = (this.dateRange[1] || new Date()).toISOString().split('T')[0];

        this.api.getFinancialSummary(start, end).subscribe({
            next: (res) => {
                this.summary.set(res);
                this.updateChart(res.byCategory);
            }
        });

        this.api.getExpenses({ startDate: start, endDate: end }).subscribe({
            next: (res) => {
                this.expenses.set(res);
                this.loading.set(false);
            }
        });
    }

    initChart() {
        this.chartOptions = {
            plugins: {
                legend: {
                    labels: { color: '#495057' },
                    position: 'bottom'
                }
            },
            maintainAspectRatio: false
        };
    }

    updateChart(byCategory: any) {
        const labels = Object.keys(byCategory);
        const data = Object.values(byCategory);

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }
            ]
        };
    }

    openNewExpense() {
        this.editingExpense.set(null);
        this.expenseForm = { monto: 0, fecha: new Date(), categoria: '', nota: '' };
        this.showExpenseDialog.set(true);
    }

    editExpense(expense: any) {
        this.editingExpense.set(expense);
        this.expenseForm = { ...expense, fecha: new Date(expense.fecha) };
        this.showExpenseDialog.set(true);
    }

    saveExpense() {
        if (!this.expenseForm.monto || !this.expenseForm.categoria) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Monto y categoría son requeridos' });
            return;
        }

        // Bloqueo manual infalible
        if (this.isSaving()) return;
        this.isSaving.set(true);

        const data = {
            ...this.expenseForm,
            id: this.editingExpense()?.id,
            fecha: this.expenseForm.fecha.toISOString().split('T')[0]
        };

        console.log('📤 Guardando gasto...', data);

        this.api.upsertExpense(data).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto guardado correctamente' });
                this.showExpenseDialog.set(false);
                this.loadData();
                // Liberar bloqueo solo después de cerrar y recargar
                setTimeout(() => this.isSaving.set(false), 500);
            },
            error: (err) => {
                console.error('Error guardando gasto:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el gasto' });
                this.isSaving.set(false);
            }
        });
    }

    deleteExpense(id: string) {
        this.api.deleteExpense(id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto eliminado' });
                this.loadData();
            }
        });
    }

    formatCurrency(value: number) {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    }
}
