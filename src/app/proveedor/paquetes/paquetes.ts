import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ProviderPackage } from '../../models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paquetes',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './paquetes.html',
  styleUrl: './paquetes.css'
})
export class PaquetesComponent implements OnInit {
  private apiService = inject(ApiService);

  public paquetes = signal<ProviderPackage[]>([]);

  ngOnInit() {
    this.apiService.getProviderPackages().subscribe({
      next: (data) => {
        console.log('Paquetes recibidos:', data);
        this.paquetes.set(data);
      },
      error: (err) => {
        console.error('Error fetching provider packages', err);
      }
    });
  }
}
