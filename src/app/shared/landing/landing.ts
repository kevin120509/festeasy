import {
  Component,
  OnInit,
  AfterViewInit,
  HostListener,
  NgZone,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  // Image Slider State
  currentSlide = 0;
  slides = ['assets/slide1.png', 'assets/slide2.png', 'assets/slide3.png'];

  // Scroll Button State
  // Scroll State
  showScrollButton = false;
  isNavbarVisible = true;
  isScrolled = false;
  isMobileMenuOpen = false;

  // Scroll tracking
  private lastScrollY = 0;
  private slideInterval: any;

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
      icon: 'app_registration',
    },
    {
      number: '2',
      title: 'Recibe ofertas reales',
      description: 'Te notificamos cuando un cliente paga el depósito por tus servicios.',
      icon: 'notifications_active',
    },
    {
      number: '3',
      title: 'Gestiona y cobra',
      description: 'Usa nuestras herramientas para contratos y recibe tu pago garantizado.',
      icon: 'handshake',
    },
  ];

  // Pricing Data
  plans = [
    {

      name: 'Sitio Web Profesional',
      price: '$399',
      period: 'MXN / mes',
      features: [
        'URL personalizada para tu negocio',
        'Diseño optimizado para móviles',
        'Edición en tiempo real',
        'Estadísticas de visitas',

        name: 'FestEasy',
        price: '$499',
        period: 'por mes',
        features: [
          'Perfil de proveedor básico',
          'Gestión de portafolio y servicios',
          'Recepción de solicitudes ilimitadas',
          'Bandeja de entrada y notificaciones',
          'Dashboard de gestión básica',

        ],
        featured: false,
        tag: 'BÁSICO',
    },
    {
<<<<<<< HEAD
      name: 'Asistente de IA Experto',
      price: '$599',
      period: 'MXN / mes',
=======
      name: 'Servicio de Agente de IA',
      price: '$499',
      period: 'por mes',
>>>>>>> 8b01e0b3d5bef279efba46350555fc0984e84d18
      features: [
        'Respuesta automática a clientes',
        'Atención 24/7 sin esfuerzo',
        'Gestión inteligente de agenda',
        'Optimización de ventas con IA',
      ],
      featured: true,
      tag: 'NUEVO',
    },
  ];

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // Auto slide - run outside Angular for performance
    this.ngZone.runOutsideAngular(() => {
      this.slideInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.currentSlide = (this.currentSlide + 1) % this.slides.length;
          this.cdr.detectChanges();
        });
      }, 4000);
    });
  }

  ngAfterViewInit(): void {
<<<<<<< HEAD
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
=======
    // 1. PRELOADER
    this.initPreloader();

    // 2. INTERSECTION OBSERVER for .animado elements
    this.initScrollAnimations();

    // 3. PARTICLES
    this.createParticles();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  // =========================================
  // PRELOADER
  // =========================================
  private initPreloader(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
          preloader.classList.add('loaded');
        }
      }, 800);
    });

    // Fallback: remove preloader after 3 seconds max
    setTimeout(() => {
      const preloader = document.getElementById('preloader');
      if (preloader && !preloader.classList.contains('loaded')) {
        preloader.classList.add('loaded');
>>>>>>> 8b01e0b3d5bef279efba46350555fc0984e84d18
      }
    }, 3000);
  }

<<<<<<< HEAD
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

=======
  // =========================================
  // INTERSECTION OBSERVER (replaces WOW.js)
  // =========================================
  private initScrollAnimations(): void {
    setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
              setTimeout(() => {
                el.classList.add('visible');
              }, delay);
>>>>>>> 8b01e0b3d5bef279efba46350555fc0984e84d18
          observer.unobserve(el);
        }
      });
    },
      { threshold: 0.15 },
    );

    document.querySelectorAll('.animado').forEach((el) => {
      observer.observe(el);
    });
  }, 200); // Small delay to ensure DOM is ready
}

<<<<<<< HEAD
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
=======
  // =========================================
  // PARTICLES
  // =========================================
  private createParticles(): void {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      const size = Math.random() * 4 + 2;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = Math.random() * 12 + 10 + 's';
      p.style.opacity = (Math.random() * 0.5 + 0.2).toString();
      container.appendChild(p);
    }
  }

  // =========================================
  // SCROLL EVENTS
  // =========================================
  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollY = window.scrollY;

    // Scroll-to-top button
    this.showScrollButton = scrollY > 500;

    // Header scrolled effect (compact + blur)
    this.isScrolled = scrollY > 50;

    // Navbar: only visible at the very top of the page
    this.isNavbarVisible = scrollY <= 10;

    this.lastScrollY = scrollY;

    // Active nav link highlight
    this.updateActiveNavLink();
>>>>>>> 8b01e0b3d5bef279efba46350555fc0984e84d18
}

  // =========================================
  // ACTIVE NAV HIGHLIGHT
  // =========================================
  private updateActiveNavLink(): void {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link-custom');
  const scrollPos = window.scrollY + 250;

  sections.forEach((section) => {
    const el = section as HTMLElement;
    if (el.offsetTop <= scrollPos && el.offsetTop + el.offsetHeight > scrollPos) {
      navLinks.forEach((link) => {
        link.classList.remove('active-link');
      });
      // Find matching nav link
      const sectionId = section.getAttribute('id');
      navLinks.forEach((link) => {
        const onClick = link.getAttribute('(click)');
        if (onClick && onClick.includes(sectionId || '')) {
          link.classList.add('active-link');
        }
      });
    }
  });
}

// =========================================
// UTILITIES
// =========================================
scrollToTop(): void {
  try {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  } catch(e) {
    window.scrollTo(0, 0);
  }
}

scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId);
  if(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

toggleVideo(event: any): void {
  const video = event.target as HTMLVideoElement;
  if(video.paused) {
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
