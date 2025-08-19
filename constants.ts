
import { Provider, Testimonial, BookingRequest, ServiceCategory, RequestStatus } from './types';

export const PROVIDERS: Provider[] = [
  {
    id: 'p1',
    brandName: 'Tacos "El Buen Sabor"',
    description: 'Auténticos tacos mexicanos para todo tipo de eventos. Sabor casero y tradicional que encantará a tus invitados.',
    category: ServiceCategory.FOOD,
    logoUrl: 'https://picsum.photos/seed/tacos/100/100',
    location: 'Ciudad de México',
    rating: 4.8,
    reviews: 120,
    gallery: ['https://picsum.photos/seed/taco1/600/400', 'https://picsum.photos/seed/taco2/600/400', 'https://picsum.photos/seed/taco3/600/400'],
    services: [
      { id: 's1-1', providerId: 'p1', name: 'Taquiza para 50 personas', description: 'Incluye 4 tipos de guisados, salsas, y tortillas.', price: 4500 },
      { id: 's1-2', providerId: 'p1', name: 'Puesto de Esquites y Elotes', description: 'El toque perfecto para tu fiesta.', price: 2000 },
    ],
  },
  {
    id: 'p2',
    brandName: 'DJ Sonido Estelar',
    description: 'La mejor música y ambiente para tu fiesta. Contamos con equipo de audio e iluminación profesional.',
    category: ServiceCategory.MUSIC,
    logoUrl: 'https://picsum.photos/seed/dj/100/100',
    location: 'Guadalajara',
    rating: 4.9,
    reviews: 85,
    gallery: ['https://picsum.photos/seed/dj1/600/400', 'https://picsum.photos/seed/dj2/600/400'],
    services: [
      { id: 's2-1', providerId: 'p2', name: 'Servicio de DJ por 5 horas', description: 'Música versátil, animador y luces robóticas.', price: 5000 },
    ],
  },
  {
    id: 'p3',
    brandName: 'DecorArte Eventos',
    description: 'Transformamos cualquier espacio en el escenario de tus sueños. Decoración con globos, flores y más.',
    category: ServiceCategory.DECORATION,
    logoUrl: 'https://picsum.photos/seed/decor/100/100',
    location: 'Ciudad de México',
    rating: 4.7,
    reviews: 95,
    gallery: ['https://picsum.photos/seed/decor1/600/400', 'https://picsum.photos/seed/decor2/600/400', 'https://picsum.photos/seed/decor3/600/400'],
    services: [
      { id: 's3-1', providerId: 'p3', name: 'Arco de Globos Orgánico', description: 'Ideal para entradas o mesa de postres.', price: 2500 },
      { id: 's3-2', providerId: 'p3', name: 'Decoración de Mesa Principal', description: 'Incluye mantel, fondo y accesorios temáticos.', price: 3000 },
    ],
  },
   {
    id: 'p4',
    brandName: 'Fotografía Momentos Mágicos',
    description: 'Capturamos la esencia de tu evento con un estilo único y profesional. Cobertura completa de tu día especial.',
    category: ServiceCategory.PHOTOGRAPHY,
    logoUrl: 'https://picsum.photos/seed/photo/100/100',
    location: 'Monterrey',
    rating: 5.0,
    reviews: 210,
    gallery: ['https://picsum.photos/seed/photo1/600/400', 'https://picsum.photos/seed/photo2/600/400'],
    services: [
      { id: 's4-1', providerId: 'p4', name: 'Paquete de Fotografía Básico', description: 'Cobertura de 4 horas, entrega de 150 fotos digitales editadas.', price: 6000 },
    ],
  },
  {
    id: 'p5',
    brandName: 'Jardín "El Paraíso"',
    description: 'Un hermoso jardín con capacidad para 200 personas. Ideal para bodas, XV años y eventos corporativos.',
    category: ServiceCategory.VENUE,
    logoUrl: 'https://picsum.photos/seed/venue/100/100',
    location: 'Guadalajara',
    rating: 4.9,
    reviews: 78,
    gallery: ['https://picsum.photos/seed/venue1/600/400', 'https://picsum.photos/seed/venue2/600/400'],
    services: [
      { id: 's5-1', providerId: 'p5', name: 'Renta de Jardín por 8 horas', description: 'Incluye mobiliario básico para 100 personas y personal de limpieza.', price: 15000 },
    ],
  },
  {
    id: 'p6',
    brandName: 'Pizzas a la Leña "Don Carlo"',
    description: 'Deliciosas pizzas artesanales horneadas al momento en tu evento. Una opción original y deliciosa.',
    category: ServiceCategory.FOOD,
    logoUrl: 'https://picsum.photos/seed/pizza/100/100',
    location: 'Guadalajara',
    rating: 4.9,
    reviews: 150,
    gallery: ['https://picsum.photos/seed/pizza1/600/400', 'https://picsum.photos/seed/pizza2/600/400'],
    services: [
      { id: 's6-1', providerId: 'p6', name: 'Servicio de Pizzas para 50 personas', description: 'Barra libre de pizzas con 5 especialidades a elegir durante 2 horas.', price: 7500 },
    ],
  },
];

export const TESTIMONIALS: Testimonial[] = [
  { id: 't1', author: 'Ana Sofía R.', text: 'FestEasy hizo que planear mi cumpleaños fuera increíblemente fácil. ¡El planificador con IA me encontró proveedores geniales que ni conocía!', rating: 5 },
  { id: 't2', author: 'Carlos Gutiérrez', text: 'Encontré un DJ excelente y a buen precio en minutos. La plataforma es muy intuitiva. Totalmente recomendada.', rating: 5 },
  { id: 't3', author: 'Mariana López', text: 'La confianza que te da ver las reseñas y poder comparar es lo mejor. Contraté el catering y fue un éxito rotundo.', rating: 4 },
];

export const BOOKING_REQUESTS: BookingRequest[] = [
    { id: 'r1', customerName: 'Laura Martínez', eventDate: '2024-08-15', eventType: 'Cumpleaños Infantil', location: 'Coyoacán, CDMX', guests: 30, service: PROVIDERS[2].services[0], status: RequestStatus.PENDING },
    { id: 'r2', customerName: 'Javier Hernández', eventDate: '2024-09-01', eventType: 'Aniversario', location: 'Polanco, CDMX', guests: 50, service: PROVIDERS[0].services[0], status: RequestStatus.PENDING },
    { id: 'r3', customerName: 'Valeria Solís', eventDate: '2024-07-30', eventType: 'Boda', location: 'Condesa, CDMX', guests: 120, service: PROVIDERS[1].services[0], status: RequestStatus.ACCEPTED },
    { id: 'r4', customerName: 'Ricardo Ponce', eventDate: '2024-07-25', eventType: 'Reunión Corporativa', location: 'Santa Fe, CDMX', guests: 80, service: PROVIDERS[0].services[0], status: RequestStatus.REJECTED },
];
