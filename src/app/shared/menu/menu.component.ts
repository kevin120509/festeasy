import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, MenuModule],
  template: `
    <div class="menu-container" [class.mini]="miniMode">
      <p-menu [model]="items" styleClass="custom-sidebar-menu"></p-menu>
    </div>
  `,
  styles: [`
    .menu-container {
      padding: 1rem;
      background: white;
    }
    :host ::ng-deep .custom-sidebar-menu {
      width: 100% !important;
      border: none !important;
      background: transparent !important;
    }
    :host ::ng-deep .p-menu {
        padding: 0;
    }
    :host ::ng-deep .p-menuitem-link {
      padding: 12px 16px !important;
      border-radius: 8px !important;
      transition: all 0.2s !important;
      color: #334155 !important;
    }
    :host ::ng-deep .p-menuitem-link:hover {
      background: #fee2e2 !important;
      color: #ef4444 !important;
    }
    :host ::ng-deep .p-menuitem-link:hover .p-menuitem-icon {
      color: #ef4444 !important;
    }
    :host ::ng-deep .p-menuitem-icon {
      margin-right: 12px !important;
      color: #64748b !important;
      font-size: 1.1rem !important;
    }
    :host ::ng-deep .p-menuitem-text {
      font-weight: 500 !important;
      transition: opacity 0.3s ease;
    }
    :host ::ng-deep .menu-container.mini .p-menuitem-text,
    :host ::ng-deep .menu-container.mini .p-submenu-header,
    :host ::ng-deep .menu-container.mini .p-menuitem-link-help-text,
    :host ::ng-deep .menu-container.mini span:not(.p-menuitem-icon):not(.pi) {
      display: none !important;
      width: 0 !important;
      opacity: 0 !important;
      overflow: hidden !important;
      visibility: hidden !important;
    }
    :host ::ng-deep .menu-container.mini .p-menuitem-link {
      justify-content: center !important;
      padding: 12px 0 !important;
      width: 100% !important;
    }
    :host ::ng-deep .menu-container.mini .p-menuitem-icon {
      margin-right: 0 !important;
      font-size: 1.5rem !important;
      float: none !important;
    }
    :host ::ng-deep .menu-container.mini .p-menu {
      padding: 0 !important;
    }
  `]
})
export class MenuComponent {
  @Input() items: MenuItem[] = [];
  @Input() miniMode: boolean = false;
}
