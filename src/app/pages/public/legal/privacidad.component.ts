import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-privacidad',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './privacidad.component.html',
    styles: [`
    .legal-container {
      max-width: 900px;
      margin: 40px auto;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      color: #334155;
      line-height: 1.6;
    }
    h1 { color: #1e293b; font-size: 2rem; margin-bottom: 2rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem; }
    h2 { color: #334155; font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; }
    p { margin-bottom: 1.2rem; }
    ul { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; list-style-type: disc; }
    .back-link { display: inline-flex; align-items: center; gap: 8px; color: #6366f1; text-decoration: none; font-weight: 500; margin-bottom: 2rem; }
    .update-date { color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem; font-style: italic; }
  `]
})
export class PrivacidadComponent {
    fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
