
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Provider, CartItem, BookingRequest, Service } from '../types';
import { PROVIDERS, BOOKING_REQUESTS } from '../constants';

interface AppContextType {
  user: User | null;
  providers: Provider[];
  cart: CartItem[];
  bookingRequests: BookingRequest[];
  login: (email: string, type: 'customer' | 'provider') => void;
  logout: () => void;
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;
  updateRequestStatus: (requestId: string, status: BookingRequest['status']) => void;
  addServiceToProvider: (service: Omit<Service, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>(PROVIDERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>(BOOKING_REQUESTS);

  const login = (email: string, type: 'customer' | 'provider') => {
    // Mock login
    const loggedInUser: User = {
      id: type === 'provider' ? 'prov1' : 'cust1',
      name: type === 'provider' ? 'DecorArte Eventos' : 'Kevin Vargas',
      email: email,
      type: type,
    };
    setUser(loggedInUser);
    if (type === 'provider') {
        // For simplicity, we assume the logged-in provider is the one with ID 'p3'
        // In a real app, this would be determined by the login credentials
         const providerUser: User = {
            id: 'p3',
            name: 'DecorArte Eventos',
            email: email,
            type: 'provider',
        };
        setUser(providerUser);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const addToCart = (service: Service) => {
    const provider = providers.find(p => p.id === service.providerId);
    if (provider && !cart.some(item => item.service.id === service.id)) {
      setCart(prevCart => [...prevCart, { service, provider }]);
    }
  };

  const removeFromCart = (serviceId: string) => {
    setCart(prevCart => prevCart.filter(item => item.service.id !== serviceId));
  };
  
  const clearCart = () => {
    setCart([]);
  }

  const updateRequestStatus = (requestId: string, status: BookingRequest['status']) => {
    setBookingRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status } : req
      )
    );
  };

  const addServiceToProvider = (service: Omit<Service, 'id'>) => {
    if (user && user.type === 'provider') {
        setProviders(prevProviders => prevProviders.map(p => {
            if (p.id === user.id) {
                const newService = { ...service, id: `s-${p.id}-${Date.now()}`};
                return { ...p, services: [...p.services, newService]};
            }
            return p;
        }));
    }
  };

  const value = {
    user,
    providers,
    cart,
    bookingRequests,
    login,
    logout,
    addToCart,
    removeFromCart,
    clearCart,
    updateRequestStatus,
    addServiceToProvider,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
