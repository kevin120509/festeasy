
export enum ServiceCategory {
  FOOD = "Comida",
  MUSIC = "Música",
  DECORATION = "Decoración",
  VENUE = "Lugar",
  PHOTOGRAPHY = "Fotografía",
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
}

export interface Provider {
  id: string;
  brandName: string;
  description: string;
  category: ServiceCategory;
  logoUrl: string;
  location: string;
  rating: number;
  reviews: number;
  gallery: string[];
  services: Service[];
}

export interface Testimonial {
  id: string;
  author: string;
  text: string;
  rating: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'customer' | 'provider';
}

export interface CartItem {
  service: Service;
  provider: Provider;
}

export enum RequestStatus {
  PENDING = "Pendiente",
  ACCEPTED = "Aceptada",
  REJECTED = "Rechazada",
}

export interface BookingRequest {
  id: string;
  customerName: string;
  eventDate: string;
  eventType: string;
  location: string;
  guests: number;
  service: Service;
  status: RequestStatus;
}
