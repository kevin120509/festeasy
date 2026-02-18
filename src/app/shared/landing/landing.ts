import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css'],
})
export class LandingComponent implements OnInit, AfterViewInit {
  // Force update for ng serve 2
  // Image Slider State
  currentSlide = 0;
  slides = ['assets/slide1.png', 'assets/slide2.png', 'assets/slide3.png'];
  
  // Scroll Button State
  showScrollButton = false;
  isNavbarVisible = true;
  isMobileMenuOpen = false;

  // Problem Section Data
  problems = [
    {
      number: '01',
      title: 'Pagos inciertos',
      description: 'Esperar semanas para cobrar o perseguir clientes para anticipos.',
    },
    {
      number: '02',
      title: 'Clientes fantasma',
      description: 'Personas que preguntan precio y desaparecen.',
    },
    {
      number: '03',
      title: 'Contratos verbales',
      description: 'Acuerdos sin validez legal que te dejan desprotegido.',
    },
    {
      number: '04',
      title: 'Agenda caótica',
      description: 'Llamadas y mensajes a deshoras para confirmar fechas.',
    },
  ];

  // How it Works Data
  steps = [
    {
      number: '1',
      title: 'Crea tu perfil verificado',
      description: 'Sube tu portafolio, define tus precios y configura tu disponibilidad.',
      icon: 'app_registration'
    },
    {
      number: '2',
      title: 'Recibe ofertas reales',
      description: 'Te notificamos cuando un cliente paga el depósito por tus servicios.',
      icon: 'notifications_active'
    },
    {
      number: '3',
      title: 'Gestiona y cobra',
      description: 'Usa nuestras herramientas para contratos y recibe tu pago garantizado.',
      icon: 'handshake'
    },
  ];

  // Pricing Data
  plans = [
    {
      name: 'Servicio de Publicidad',
      price: '$299',
      period: 'MXN / mes',
      features: [
        'URL personalizada para compartir',
        'Promoción en redes sociales',
        'Mayor alcance de clientes',
        'Estadísticas de visitas',
      ],
      featured: true,
      tag: 'MÁS POPULAR'
    },
    {
      name: 'Servicio de Agente de IA',
      price: '$499',
      period: 'MXN / mes',
      features: [
        'Automatización de solicitudes',
        'Asistente experto en tu negocio',
        'Solicitudes disponibles para tu agenda',
        'Respuestas inteligentes',
      ],
      featured: false,
      tag: 'NUEVO'
    },
  ];

  ngOnInit(): void {
    // Auto slide
    setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }, 4000);
  }

  ngAfterViewInit(): void {
    // Custom WOW.js implementation to avoid build errors with 'require'
    // This replicates the exact behavior of WOW.js:
    // 1. Hides elements with .wow class
    // 2. Checks for scroll
    // 3. Reveals them and adds animation class
    
    class CustomWow {
      boxClass: string;
      animateClass: string;
      offset: number;
      mobile: boolean;
      live: boolean;
      
      constructor(options: any = {}) {
        this.boxClass = options.boxClass || 'wow';
        this.animateClass = options.animateClass || 'animate__animated';
        this.offset = options.offset || 0;
        this.mobile = options.mobile !== false;
        this.live = options.live !== false;
      }

      init() {
        const elements = document.querySelectorAll(`.${this.boxClass}`);
        
        // Initial hide and setup
        elements.forEach((el: any) => {
          el.style.visibility = 'hidden';
          // If animation names are in 'data-wow-animation' or just standard usage
          // In standard usage, the animation class (e.g. animate__fadeInUp) is already on the element.
          // We just need to toggle visibility and add the 'animated' class.
        });

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              el.style.visibility = 'visible';
              el.classList.add(this.animateClass);
              // Trigger animation (sometimes removing/re-adding helps if it was already there)
              const existingAnimationClasses = Array.from(el.classList).filter(c => c.startsWith('animate__'));
              existingAnimationClasses.forEach(c => {
                  el.classList.remove(c);
                  void el.offsetWidth; // trigger reflow
                  el.classList.add(c);
              });
              
              observer.unobserve(el);
            }
          });
        }, {
          rootMargin: '0px',
          threshold: 0.1
        });

        elements.forEach(el => observer.observe(el));
      }
    }

    // Initialize
    setTimeout(() => {
      new CustomWow({
        boxClass: 'wow',
        animateClass: 'animate__animated',
        offset: 0
      }).init();
    }, 100);
  }
  
  @HostListener('window:scroll')
  onWindowScroll() {
    this.showScrollButton = window.scrollY > 500;
    
    // Logic for hiding/showing navbar
    // If we are near the top (e.g. within Hero section), show it.
    // If we scroll down past a threshold, hide it.
    // User requested: "hide menu when scrolling... and when returning to hero appear"
    if (window.scrollY > 100) {
      this.isNavbarVisible = false;
    } else {
      this.isNavbarVisible = true;
    }
  }

  scrollToTop(): void {
    try {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } catch (e) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleVideo(event: any): void {
    const video = event.target as HTMLVideoElement;
    if (video.paused) {
      video.muted = false;
      video.play();
    } else {
      video.pause();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
