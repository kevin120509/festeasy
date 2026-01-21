import { Component, OnInit, inject } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { MenuItem, MessageService } from 'primeng/api';

@Component({
    template: `
        <div class="card flex justify-center">
            <p-toast></p-toast>
            <p-menu [model]="items"></p-menu>
        </div>
    `,
    standalone: true,
    imports: [MenuModule, ToastModule],
    providers: [MessageService]
})
export class MenuCommandDemo implements OnInit {
    private messageService = inject(MessageService);
    items: MenuItem[] | undefined;

    ngOnInit() {
        this.items = [
            {
                label: 'New',
                icon: 'pi pi-plus',
                command: () => {
                    this.update();
                }
            },
            {
                label: 'Search',
                icon: 'pi pi-search',
                command: () => {
                    this.delete();
                }
            }
        ];
    }

    update() {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File created', life: 3000 });
    }

    delete() {
        this.messageService.add({ severity: 'warn', summary: 'Search Completed', detail: 'No results found', life: 3000 });
    }
}