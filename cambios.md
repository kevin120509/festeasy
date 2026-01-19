<!DOCTYPE html>

<html class="light" lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800;900&amp;family=Noto+Sans:wght@400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#0a6e80",
                        "background-light": "#F8FFFF",
                        "background-dark": "#121820",
                        "critical-red": "#E01D25",
                        "success-green": "#22C55E",
                        "warning-orange": "#F9B249",
                        "technical-gray": "#F4F7F9"
                    },
                    fontFamily: {
                        "display": ["Epilogue", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "1rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .btn-success-gradient {
            background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark font-display min-h-screen">
<div class="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
<div class="layout-container flex h-full grow flex-col">
<!-- Top Navigation Bar -->
<header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white/70 backdrop-blur-md px-10 py-3 sticky top-0 z-50">
<div class="flex items-center gap-8">
<div class="flex items-center gap-4 text-primary">
<div class="size-8">
<svg fill="none" viewbox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor"></path>
</svg>
</div>
<h2 class="text-[#0d191b] text-xl font-black leading-tight tracking-[-0.015em]">FestEasy</h2>
</div>
<nav class="flex items-center gap-6">
<a class="text-[#4c8e9a] hover:text-primary text-sm font-semibold transition-colors" href="#">Dashboard</a>
<a class="text-primary text-sm font-bold border-b-2 border-primary py-1" href="#">Solicitudes</a>
<a class="text-[#4c8e9a] hover:text-primary text-sm font-semibold transition-colors" href="#">Calendario</a>
<a class="text-[#4c8e9a] hover:text-primary text-sm font-semibold transition-colors" href="#">Perfil</a>
</nav>
</div>
<div class="flex flex-1 justify-end gap-6 items-center">
<label class="flex flex-col min-w-40 !h-10 max-w-64">
<div class="flex w-full flex-1 items-stretch rounded-xl h-full bg-[#f0f5f6]">
<div class="text-[#4c8e9a] flex items-center justify-center pl-4">
<span class="material-symbols-outlined text-xl">search</span>
</div>
<input class="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-base font-normal px-4 pl-2" placeholder="Buscar solicitud..."/>
</div>
</label>
<div class="flex gap-2">
<button class="size-10 flex items-center justify-center rounded-xl bg-[#f0f5f6] text-primary relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-2 right-2 size-2 bg-critical-red rounded-full"></span>
</button>
<button class="size-10 flex items-center justify-center rounded-xl bg-[#f0f5f6] text-primary">
<span class="material-symbols-outlined">settings</span>
</button>
</div>
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/20" data-alt="User profile avatar" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuAX2yQonzN2O669JgZLqZJbcY30vnDsShA5T6VqiG6xD2EO9VbQW4JcHk105ca3HfnGF4P9ZI--hHo6h21IeSLoJ-4wlew18Ec2Z-HEw6kmowEBFzaR5YEBnKDEm-Q5SQqZJqwHPQpIC-bSYZ286qV5ij9tE5WBUVwOsSUqj8qk938Zf1rqnfKi4ODl30pV4PW49fwrXYDct0DUNgKmEtnpi9VeF8gNGDp29ymP-TW7xBESjo46Sw0jbyfvOTGKR9KTe2Sw9KXWxPM");'></div>
</div>
</header>
<main class="max-w-[1000px] mx-auto w-full px-6 py-10">
<!-- Page Heading -->
<div class="flex flex-wrap justify-between items-end gap-4 mb-8">
<div class="flex flex-col gap-2">
<h1 class="text-[#0d191b] text-4xl font-black leading-tight tracking-[-0.033em]">Solicitudes Recibidas</h1>
<p class="text-[#4c8e9a] text-lg font-medium">Recuerda responder antes de 24h para mantener tu reputación.</p>
</div>
<button class="flex items-center gap-2 rounded-full h-11 px-6 bg-white border border-primary/20 text-primary text-sm font-bold shadow-sm hover:bg-[#f0f5f6] transition-all">
<span class="material-symbols-outlined text-lg">tune</span>
<span>Configurar Notificaciones</span>
</button>
</div>
<!-- Modern Pill Tabs -->
<div class="mb-8 overflow-x-auto">
<div class="flex items-center gap-3 p-1.5 bg-[#f0f5f6] rounded-full w-fit">
<a class="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-primary shadow-sm font-bold text-sm" href="#">
<span>Pendientes</span>
<span class="flex items-center justify-center bg-critical-red text-white text-[10px] size-5 rounded-full">3</span>
</a>
<a class="flex items-center px-6 py-2.5 rounded-full text-[#4c8e9a] font-bold text-sm hover:text-primary transition-colors" href="#">
                            Aceptadas
                        </a>
<a class="flex items-center px-6 py-2.5 rounded-full text-[#4c8e9a] font-bold text-sm hover:text-primary transition-colors" href="#">
                            Historial
                        </a>
</div>
</div>
<!-- Request Cards Grid -->
<div class="flex flex-col gap-8">
<!-- Card 1 (CRITICAL) -->
<div class="group relative bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-primary/5 overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
<!-- Urgency Banner -->
<div class="bg-critical-red px-6 py-2.5 flex items-center gap-2 text-white text-sm font-bold uppercase tracking-wider">
<span class="material-symbols-outlined text-lg">schedule</span>
<span>CRÍTICO: Quedan 04h 35m para responder</span>
</div>
<div class="p-8 flex flex-col md:flex-row gap-8">
<!-- Left Column: Profile & Context -->
<div class="flex-1 flex gap-6">
<div class="size-20 rounded-2xl bg-center bg-no-repeat bg-cover border-4 border-[#f8fbfc]" data-alt="Client Mariana Rivera profile" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuD1mStytDOm16Xz_a9CYbQGPtapEwNE6bpzztFhSwrOZcOiXGkJTIOBbc83R3hL3AWoP2dxPQlbicyCb18zQmabG-b77ndcx2cOJQh76Lo_6-6DxZiSpXdP3kQLIeln3Uw0QGmcFIYFdDKct-MMrXR4usbdHv2oIWc57uUAp6DHxWF_p5f4ZW7EDWQt5qznKyLg3CF4Iv08twHZrLpROKWXBQrWhdaE-5cAxPSpKvsZUi15Rqhjyfr7p1dMU78380r8MhXUX8gtiiE");'></div>
<div class="flex flex-col gap-2">
<div class="flex items-center gap-3">
<h3 class="text-[#0d191b] text-2xl font-black">Mariana Rivera</h3>
<span class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-tighter">Boda</span>
</div>
<div class="flex flex-col gap-1 text-[#4c8e9a]">
<div class="flex items-center gap-1.5 font-semibold text-sm">
<span class="material-symbols-outlined text-base">calendar_today</span>
<span>Sáb, 20 Oct 2024</span>
</div>
<a class="flex items-center gap-1.5 font-semibold text-sm text-primary hover:underline underline-offset-4 decoration-2" href="#">
<span class="material-symbols-outlined text-base">location_on</span>
<span>Hacienda Los Arcángeles, CDMX</span>
</a>
</div>
</div>
</div>
<!-- Right Column: Service & Price -->
<div class="flex-1 flex flex-col items-start md:items-end justify-between text-left md:text-right gap-4">
<div>
<p class="text-[#4c8e9a] text-sm font-bold uppercase tracking-widest mb-1">Servicio Solicitado</p>
<p class="text-[#0d191b] text-lg font-bold">Paquete DJ Premium Gold (5 Horas)</p>
</div>
<div class="bg-[#f0f5f6] px-6 py-4 rounded-xl border border-primary/5">
<p class="text-[#4c8e9a] text-xs font-bold uppercase tracking-widest mb-1">Precio Total</p>
<p class="text-primary text-3xl font-black">$12,500 MXN</p>
</div>
</div>
</div>
<!-- Action Footer -->
<div class="flex border-t border-primary/5">
<button class="flex-1 py-5 bg-technical-gray hover:bg-[#ebf0f2] text-[#4c8e9a] font-bold text-sm flex items-center justify-center gap-2 transition-colors">
<span class="material-symbols-outlined text-lg">close</span>
                                Rechazar Solicitud
                            </button>
<button class="flex-1 py-5 btn-success-gradient text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-lg">check_circle</span>
                                Aceptar y Agendar
                            </button>
</div>
</div>
<!-- Card 2 (NORMAL) -->
<div class="group relative bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-primary/5 overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
<!-- Urgency Banner (Warning) -->
<div class="bg-warning-orange px-6 py-2.5 flex items-center gap-2 text-white text-sm font-bold uppercase tracking-wider">
<span class="material-symbols-outlined text-lg">schedule</span>
<span>Quedan 18h 20m para responder</span>
</div>
<div class="p-8 flex flex-col md:flex-row gap-8">
<!-- Left Column -->
<div class="flex-1 flex gap-6">
<div class="size-20 rounded-2xl bg-center bg-no-repeat bg-cover border-4 border-[#f8fbfc]" data-alt="Client Roberto Galvan profile" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDSqPlLh7CASaCcu4UNJjNNqOR0tnpm0Gcru3F0k0CTaqGQrKVTYe6g-JfV4SoRSZYcO3zJs-kJxWdFEw-DZ4F_fyPfG0CSrIFyC1TB4nabl2KO7Gya09Y3dzvMC2m-uNYB418whWhpROXv6rNGsCHgVgm8ACDboavXYe0ld5zxn43c7Lenruna7WjCwyCXpQkIowy0l1_8a2VU0xZJ5AIHwZVHxDG621P7CQ4DxotolXnZbYpLgWw4L2IKhNGyfN74oplx4MoGpX4");'></div>
<div class="flex flex-col gap-2">
<div class="flex items-center gap-3">
<h3 class="text-[#0d191b] text-2xl font-black">Roberto Galván</h3>
<span class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-tighter">XV Años</span>
</div>
<div class="flex flex-col gap-1 text-[#4c8e9a]">
<div class="flex items-center gap-1.5 font-semibold text-sm">
<span class="material-symbols-outlined text-base">calendar_today</span>
<span>Sáb, 15 Nov 2024</span>
</div>
<a class="flex items-center gap-1.5 font-semibold text-sm text-primary hover:underline underline-offset-4 decoration-2" href="#">
<span class="material-symbols-outlined text-base">location_on</span>
<span>Salón Los Cedros, CDMX</span>
</a>
</div>
</div>
</div>
<!-- Right Column -->
<div class="flex-1 flex flex-col items-start md:items-end justify-between text-left md:text-right gap-4">
<div>
<p class="text-[#4c8e9a] text-sm font-bold uppercase tracking-widest mb-1">Servicio Solicitado</p>
<p class="text-[#0d191b] text-lg font-bold">Iluminación Arquitectónica + Audio</p>
</div>
<div class="bg-[#f0f5f6] px-6 py-4 rounded-xl border border-primary/5">
<p class="text-[#4c8e9a] text-xs font-bold uppercase tracking-widest mb-1">Precio Total</p>
<p class="text-primary text-3xl font-black">$8,200 MXN</p>
</div>
</div>
</div>
<!-- Action Footer -->
<div class="flex border-t border-primary/5">
<button class="flex-1 py-5 bg-technical-gray hover:bg-[#ebf0f2] text-[#4c8e9a] font-bold text-sm flex items-center justify-center gap-2 transition-colors">
<span class="material-symbols-outlined text-lg">close</span>
                                Rechazar Solicitud
                            </button>
<button class="flex-1 py-5 btn-success-gradient text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-lg">check_circle</span>
                                Aceptar y Agendar
                            </button>
</div>
</div>
</div>
</main>
</div>
</div>
</body></html>