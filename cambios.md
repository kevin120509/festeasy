<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>FestEasy - Mis Solicitudes</title>
<link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;700;900&amp;family=Manrope:wght@400;500;700&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#e21d24",
                        "background-light": "#faffff",
                        "background-dark": "#0f1315",
                        "glacial": "#F8FFFF",
                        "jet": "#010302",
                    },
                    fontFamily: {
                        "display": ["Epilogue", "sans-serif"],
                        "body": ["Manrope", "sans-serif"],
                    },
                    borderRadius: {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "premium": "2rem", // 32px
                        "full": "9999px"
                    },
                    boxShadow: {
                        "premium": "0 20px 40px -10px rgba(0,0,0,0.06)",
                    }
                },
            },
        }
    </script>
<style>
        body {
            font-family: 'Manrope', sans-serif;
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Epilogue', sans-serif;
        }
    </style>
</head>
<body class="bg-glacial min-h-screen text-jet">
<!-- Top Navigation -->
<header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
<div class="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
<!-- Logo Area -->
<div class="flex items-center gap-3">
<div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
<span class="material-symbols-outlined">celebration</span>
</div>
<span class="text-xl font-bold tracking-tight text-jet font-display">FestEasy</span>
</div>
<!-- Desktop Menu -->
<nav class="hidden md:flex items-center gap-10">
<a class="text-sm font-semibold text-jet hover:text-primary transition-colors" href="#">Explorar Servicios</a>
<a class="text-sm font-semibold text-primary" href="#">Mis Eventos</a>
<a class="text-sm font-semibold text-jet hover:text-primary transition-colors" href="#">Ayuda</a>
</nav>
<!-- Actions -->
<div class="flex items-center gap-4">
<button class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors text-jet">
<span class="material-symbols-outlined text-[20px]">notifications</span>
</button>
<div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
<img alt="Profile portrait of a smiling woman" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA47RcQaCLdoCwi5WC-R8MFvRUg44jbJeczbw2rKO-DZKazBZsbt-ioAppLWdCyWH2qFBOJgC2MEMfaxnXoUVCUQBL0s2xZQVt0l3mXnMTlHs8EgmCMh9QfzQ2IIFE46q7QOwOR5Fh16G1h0L11ebUp7OR4NiydRB_TPGw8MGPr3tOPMRAv3bNso-rBdgpKrcS-ghK6NAIRyd506ZHolst3DtKogtPvWhKBWQIPg23Tyn2OGXGjyR_d5ts7zPClpS0XU_DrMHb-sAk"/>
</div>
</div>
</div>
</header>
<main class="max-w-[1024px] mx-auto px-6 py-12 pb-24">
<!-- Page Heading & Tabs -->
<div class="flex flex-col items-center gap-8 mb-12">
<h1 class="text-4xl md:text-5xl font-black text-center text-jet tracking-tight">
                Seguimiento de mi Evento
            </h1>
<!-- Tabs -->
<div class="inline-flex items-center p-1 bg-white rounded-full shadow-sm border border-gray-100">
<button class="px-8 py-2.5 rounded-full bg-jet text-white text-sm font-bold shadow-md transition-all">
                    Activas
                </button>
<button class="px-8 py-2.5 rounded-full text-gray-500 hover:bg-gray-50 text-sm font-bold transition-all">
                    Historial
                </button>
</div>
</div>
<!-- Cards Container -->
<div class="flex flex-col gap-8">
<!-- Card 1: Confirmed -->
<article class="group bg-white rounded-premium p-6 shadow-premium transition-transform duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-100">
<div class="flex flex-col md:flex-row gap-6">
<!-- Content -->
<div class="flex-1 flex flex-col justify-between gap-6">
<!-- Header -->
<div class="flex items-start justify-between">
<div class="flex items-center gap-3">
<div class="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
<img alt="Provider logo portrait" class="w-full h-full object-cover" data-alt="Provider logo portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV3oUk6sYAMVng-pOMSgE2HO2GeJh3JDol7-rXp98-eyNOyD-0jRLXXkk9M2eShoSeoEaIJdi9Nhjjqd--_n_LyLbCYLUbJvh7wtzHNryMtks1WiLWPgRR7Den5qASbnoIrmvkMxLBYjVVug2mFdEm16xw_SDkozfFAuRCdUQvBzQwB9e4knWjXY6rcdP36SMM90_M-LdCydMSCDr8ylMiP6uSS0X4bOvYlqmbgZ0bnj6U0iHWdpGJIqxGtAeLoXFD3cLLhFqrqK4"/>
</div>
<div>
<p class="text-sm text-gray-500 font-medium">Proveedor</p>
<h4 class="text-base font-bold text-jet leading-tight">DJ Sonic Boom</h4>
</div>
</div>
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider">
<span class="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                Confirmado
                            </span>
</div>
<!-- Body -->
<div>
<h3 class="text-2xl font-bold text-jet mb-3 font-display">Paquete Sonido Premium</h3>
<div class="flex flex-wrap gap-4 text-gray-600">
<div class="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
<span class="material-symbols-outlined text-[18px]">calendar_today</span>
<span>Sáb, 24 Oct</span>
</div>
<div class="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
<span class="material-symbols-outlined text-[18px]">schedule</span>
<span>8:00 PM - 2:00 AM</span>
</div>
<div class="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
<span class="material-symbols-outlined text-[18px]">location_on</span>
<span>Salón Los Olivos</span>
</div>
</div>
</div>
<!-- Actions -->
<div class="flex items-center gap-3 pt-2">
<button aria-label="Chat" class="h-12 w-12 flex items-center justify-center rounded-full border border-gray-200 text-jet hover:bg-gray-50 transition-colors">
<span class="material-symbols-outlined">chat_bubble</span>
</button>
<button class="h-12 px-8 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-700 transition-colors flex items-center gap-2">
<span>Detalles</span>
<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</div>
<!-- Image -->
<div class="w-full md:w-[320px] aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden relative">
<div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
<img alt="DJ turning tables at a colorful party" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" data-alt="DJ turning tables at a colorful party" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtcJUr-JtW20cyMFS3aDbjGtFWcEY_FTC0yyJeTCHRAZFj2Z67t3rOsxHkAkkIYj_5dexFQ3MeXRg8_s9aw74uckME30X6r3tGU-gn2a6NGvdroChex_0Q4-tFyAQL2qMjRKwWeJQ4lwILM9VrfQK-wRPF7ida3UaFA33B15sIVwCCg7nN1RvsJIfxxVYEYUXCUpSJsBT0uX2sLpULVchJxzpYRJS4BsX1AnqOSfOj_E_hZiadJ6xU8YNXnCcT7571ExIYAkjENs4"/>
</div>
</div>
</article>
<!-- Card 2: Pending -->
<article class="group bg-white rounded-premium p-6 shadow-premium transition-transform duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-100">
<div class="flex flex-col md:flex-row gap-6">
<div class="flex-1 flex flex-col justify-between gap-6">
<div class="flex items-start justify-between">
<div class="flex items-center gap-3">
<div class="w-12 h-12 rounded-full bg-orange-50 overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center text-orange-400">
<span class="material-symbols-outlined">restaurant</span>
</div>
<div>
<p class="text-sm text-gray-500 font-medium">Proveedor</p>
<h4 class="text-base font-bold text-jet leading-tight">Catering Delicioso</h4>
</div>
</div>
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold uppercase tracking-wider">
<span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                Esperando al Proveedor
                            </span>
</div>
<div>
<h3 class="text-2xl font-bold text-jet mb-3 font-display">Banquete Boda Gold</h3>
<div class="flex flex-wrap gap-4 text-gray-600">
<div class="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
<span class="material-symbols-outlined text-[18px]">calendar_today</span>
<span>Sáb, 24 Oct</span>
</div>
<div class="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
<span class="material-symbols-outlined text-[18px]">schedule</span>
<span>6:00 PM</span>
</div>
</div>
</div>
<div class="flex items-center gap-3 pt-2">
<button class="h-12 w-12 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 cursor-not-allowed" disabled="">
<span class="material-symbols-outlined">chat_bubble</span>
</button>
<button class="h-12 px-6 rounded-full bg-gray-100 text-gray-500 font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors">
<span>Ver Solicitud</span>
</button>
</div>
</div>
<div class="w-full md:w-[320px] aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden relative grayscale-[30%] opacity-90">
<img alt="Elegant catering food setup" class="w-full h-full object-cover" data-alt="Elegant catering food setup" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMJLULNeLIXTUPeGlrwCzZ82n3QaVbg-mVNPbkimhIH_pSUXqRVX_mBQ6bdNvryBmKfucZmrs-5nYilSE4sHa2OkyDXUCnhZJeYAjB3b7wc0oX-t9oqVZcVvFgMWp8wkOgmd7kJCL6EtF79-Gt-NkTQzL_grnXoJuKOFfN7ugn5PfZsKpZ7w2B4LhC5ZOqS_i3Dx2-vizmURkH2zdEnf4z27Gv3RgfRRv7Q9LENBFXqCc8p-c9LxC2ZkRbyjmv5-B_qhfm55iseOM"/>
</div>
</div>
</article>
<!-- Card 3: Rejected/Unavailable -->
<article class="group bg-white rounded-premium p-6 shadow-premium border border-red-50 relative overflow-hidden">
<!-- Decorative background accent -->
<div class="absolute -right-10 -top-10 w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
<div class="flex flex-col md:flex-row gap-6 relative z-10">
<div class="flex-1 flex flex-col justify-between gap-6">
<div class="flex items-start justify-between">
<div class="flex items-center gap-3 opacity-60">
<div class="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
<img alt="Photographer logo" class="w-full h-full object-cover grayscale" data-alt="Photographer logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIamroPoFqZZJBpxRJC2MIWqIQEblHY2td1Y9CUmVkP-k43WNmf6sYFk7hSDpt-3zIm74-z1eIupF08hhQQ3jdnhrX5ElxmXHcj4jpHItx4itGeupkt3TDtoz-hcOM8mFF4gwj9Tsmr2UJvXcS6okuxIxzArn2ryzwGElcp_00JGSpaPft4kFJ7DoNZuXR74ZraARIGMZlaHd2C1y9DeEHwAj6Lqm7iUC-Pw729o85SBrL5919DZ3A53AYRWQAUaif_D3i1deH0NU"/>
</div>
<div>
<p class="text-sm text-gray-500 font-medium">Proveedor</p>
<h4 class="text-base font-bold text-jet leading-tight">Fotografía Luz</h4>
</div>
</div>
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider">
<span class="material-symbols-outlined text-[14px]">close</span>
                                No disponible
                            </span>
</div>
<div>
<h3 class="text-2xl font-bold text-gray-400 mb-3 font-display line-through decoration-red-300">Sesión Pre-Boda</h3>
<!-- Helpful Alternative UI -->
<div class="mt-4 p-4 rounded-xl bg-glacial border border-cyan-100 flex gap-4 items-start">
<div class="p-2 bg-white rounded-full text-primary shrink-0 shadow-sm">
<span class="material-symbols-outlined">support_agent</span>
</div>
<div>
<p class="text-sm text-gray-700 font-medium leading-relaxed">
                                        No te preocupes, estamos buscando al siguiente proveedor más cercano para ti.
                                    </p>
<a class="inline-flex items-center gap-1 text-sm font-bold text-primary mt-2 hover:underline" href="#">
                                        Buscar alternativas
                                        <span class="material-symbols-outlined text-[16px]">arrow_right_alt</span>
</a>
</div>
</div>
</div>
<div class="flex items-center gap-3 pt-2 opacity-50 pointer-events-none">
<button class="h-12 w-12 flex items-center justify-center rounded-full border border-gray-200 text-jet">
<span class="material-symbols-outlined">chat_bubble</span>
</button>
<button class="h-12 px-8 rounded-full bg-gray-100 text-gray-400 font-bold text-sm">
                                Detalles
                            </button>
</div>
</div>
<div class="w-full md:w-[320px] aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden relative grayscale opacity-60">
<div class="absolute inset-0 flex items-center justify-center bg-black/10">
<span class="material-symbols-outlined text-white/80 text-6xl">image_not_supported</span>
</div>
<img alt="Camera lens with soft bokeh" class="w-full h-full object-cover" data-alt="Camera lens with soft bokeh" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPmDm_sv6R0mOW2exX5R_Ycv8cAfwUXBHfVj1Fgp_L9BK1OJDr8JGNHY3_1-VQ7Am4W0Q-iB5Wl79f7j81aTPvPSayDiw_Dm56_oBlgnl8JwcVRdHyb9CM4rOL1BDxNjyuGt5JGACu5rgD_YzJhbUJaXOvb3LaRcybq5BBCuU8Ek_62Ej-lLNwyxEiPZO-vnLB5Q1rtRnGEnWfBpJdkalnRyPuX8R2td2rShxy5mR1JeVuuD6GF74TYIj4fbP9rTecr11iIs5N-hU"/>
</div>
</div>
</article>
</div>
<!-- Empty State Hint (Hidden for now, but contextually useful) -->
<!-- 
        <div class="mt-12 text-center text-gray-400">
            <p class="text-sm">Mostrando 3 de 3 solicitudes</p>
        </div>
        -->
</main>
</body></html>