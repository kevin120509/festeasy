import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Provider, Testimonial, ServiceCategory, Service } from '../../types';
import { TESTIMONIALS } from '../../constants';

// Since we can't import components, we define them here.
// In a real project, these would be in separate files.

const Header: React.FC<{ onCartClick: () => void; onProviderClick: () => void }> = ({ onCartClick, onProviderClick }) => {
  const { cart } = useAppContext();
  // @ts-ignore
  const { ShoppingCart } = window.LucideReact || {};
  return (
    <header className="bg-white/80 backdrop-blur-lg fixed top-0 left-0 right-0 z-40 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="#" className="text-2xl font-bold text-primary">🎈 FestEasy</a>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#explore" className="text-gray-600 hover:text-primary transition-colors">Explorar</a>
          <a href="#benefits" className="text-gray-600 hover:text-primary transition-colors">Beneficios</a>
          <a href="#testimonials" className="text-gray-600 hover:text-primary transition-colors">Testimonios</a>
        </nav>
        <div className="flex items-center space-x-4">
          <button onClick={onCartClick} className="relative text-gray-600 hover:text-primary transition-colors">
            {ShoppingCart && <ShoppingCart size={24} />}
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cart.length}</span>
            )}
          </button>
          <button onClick={onProviderClick} className="bg-secondary hover:bg-secondary-hover text-white font-bold py-2 px-4 rounded-full transition-transform transform hover:scale-105">
            Soy Proveedor
          </button>
        </div>
      </div>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-dark text-white py-8">
    <div className="container mx-auto px-6 text-center">
      <p>&copy; {new Date().getFullYear()} FestEasy. Todos los derechos reservados.</p>
      <p className="text-sm text-gray-400 mt-2">Tu evento ideal, sin esfuerzo.</p>
    </div>
  </footer>
);

const ProviderCard: React.FC<{ provider: Provider; onClick: () => void }> = ({ provider, onClick }) => {
    // @ts-ignore
    const { Star, MapPin } = window.LucideReact || {};
    return (
      <div onClick={onClick} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
        <img src={provider.gallery[0]} alt={provider.brandName} className="w-full h-48 object-cover" />
        <div className="p-4">
          <div className="flex items-center mb-2">
            <img src={provider.logoUrl} alt={`${provider.brandName} logo`} className="w-10 h-10 rounded-full mr-3" />
            <div>
              <h3 className="font-bold text-lg text-dark">{provider.brandName}</h3>
              <p className="text-sm text-gray-500">{provider.category}</p>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center">
              {Star && <Star className="text-yellow-400 mr-1" size={16} fill="currentColor" />}
              <span>{provider.rating} ({provider.reviews} reseñas)</span>
            </div>
            <div className="flex items-center">
              {MapPin && <MapPin className="mr-1" size={16} />}
              <span>{provider.location}</span>
            </div>
          </div>
        </div>
      </div>
    );
};

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
    // @ts-ignore
    const { Star } = window.LucideReact || {};
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-4">
          {[...Array(5)].map((_, i) => (
            Star && <Star key={i} size={20} className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'} fill="currentColor" />
          ))}
        </div>
        <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
        <p className="font-bold text-right text-dark">- {testimonial.author}</p>
      </div>
    );
};

// --- Modal Components ---
import Modal from '../../components/Modal';
import { generatePartyPlan } from '../../services/geminiService';
import { useNavigate } from 'react-router-dom';

const LocationModal: React.FC<{ isOpen: boolean; onClose: () => void; onLocationSet: (location: string) => void }> = ({ isOpen, onClose, onLocationSet }) => {
    // @ts-ignore
    const { MapPin } = window.LucideReact || {};
    const handleUseLocation = () => {
        // Mocking location detection for this environment
        onLocationSet("Ciudad de México");
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bienvenido a FestEasy">
            <p className="text-gray-600 mb-6">Para mostrarte los mejores proveedores, necesitamos saber dónde será tu evento.</p>
            <div className="flex flex-col space-y-4">
                <button onClick={handleUseLocation} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                    {MapPin && <MapPin className="mr-2" size={20} />} Usar mi ubicación actual
                </button>
                <button onClick={() => { onLocationSet("Ciudad de México"); onClose(); }} className="w-full bg-gray-200 hover:bg-gray-300 text-dark font-bold py-3 px-4 rounded-lg">
                    Lo haré más tarde
                </button>
            </div>
        </Modal>
    );
};


const ProviderDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; provider: Provider | null }> = ({ isOpen, onClose, provider }) => {
    const { addToCart } = useAppContext();

    if (!provider) return null;

    const handleAddToCart = (service: Service) => {
        addToCart(service);
        alert(`${service.name} agregado al carrito!`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={provider.brandName}>
            <div className="space-y-6">
                <img src={provider.gallery[0]} alt={provider.brandName} className="w-full h-60 object-cover rounded-lg" />
                <p className="text-gray-700">{provider.description}</p>
                
                <div>
                    <h4 className="font-bold text-lg mb-2">Galería</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {provider.gallery.map((img, i) => (
                            <img key={i} src={img} alt={`Gallery image ${i+1}`} className="w-full h-24 object-cover rounded-md" />
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">Servicios Disponibles</h4>
                    <ul className="space-y-3">
                        {provider.services.map(service => (
                            <li key={service.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{service.name}</p>
                                    <p className="text-sm text-gray-600">${service.price.toLocaleString('es-MX')}</p>
                                </div>
                                <button onClick={() => handleAddToCart(service)} className="bg-secondary hover:bg-secondary-hover text-white text-sm font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105">
                                    Reservar
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

interface AIResult {
    plan: { providerId: string; serviceId: string; }[];
    justification: string;
    totalCost: number;
}


const AIPlannerModal: React.FC<{ isOpen: boolean; onClose: () => void; setAiResult: (result: AIResult | null) => void; setIsLoading: (loading: boolean) => void; }> = ({ isOpen, onClose, setAiResult, setIsLoading }) => {
    const [budget, setBudget] = useState(10000);
    const [location, setLocation] = useState('Ciudad de México');
    const { providers } = useAppContext();
    // @ts-ignore
    const { PartyPopper } = window.LucideReact || {};

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        onClose();
        try {
            const result = await generatePartyPlan(budget, location, providers);
            setAiResult(result);
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crea tu Fiesta con IA">
            <div className="space-y-6">
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación del Evento</label>
                    <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Presupuesto</label>
                    <div className="flex items-center space-x-4 mt-2">
                        <input type="range" id="budget" min="1000" max="50000" step="1000" value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-bold text-primary w-24 text-center">${budget.toLocaleString('es-MX')}</span>
                    </div>
                </div>
                <button onClick={handleGeneratePlan} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
                    {PartyPopper && <PartyPopper className="mr-2" size={20} />} Generar Plan
                </button>
            </div>
        </Modal>
    );
};

const AIResultsModal: React.FC<{ isOpen: boolean; onClose: () => void; result: AIResult | null }> = ({ isOpen, onClose, result }) => {
    const { providers, addToCart, clearCart } = useAppContext();
    // @ts-ignore
    const { ShoppingCart } = window.LucideReact || {};

    if (!result) return null;

    const recommendedItems = result.plan.map(item => {
        const provider = providers.find(p => p.id === item.providerId);
        const service = provider?.services.find(s => s.id === item.serviceId);
        return { provider, service };
    }).filter(item => item.provider && item.service);

    const handleAddPackageToCart = () => {
        clearCart();
        recommendedItems.forEach(item => {
            if (item.service) {
                addToCart(item.service);
            }
        });
        alert("¡Paquete completo agregado al carrito!");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tu Plan de Fiesta Personalizado">
            <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-indigo-800">{result.justification}</p>
                </div>
                <ul className="space-y-3">
                    {recommendedItems.map(({ provider, service }, index) => (
                        <li key={index} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-bold">{provider?.brandName} <span className="text-sm font-normal text-gray-500">({provider?.category})</span></p>
                            <div className="flex justify-between items-center">
                                <p className="text-gray-700">{service?.name}</p>
                                <p className="font-semibold">${service?.price.toLocaleString('es-MX')}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="text-right font-bold text-xl pt-4 border-t">
                    Costo Total: <span className="text-primary">${result.totalCost.toLocaleString('es-MX')}</span>
                </div>
                 <button onClick={handleAddPackageToCart} className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center mt-4">
                    {ShoppingCart && <ShoppingCart className="mr-2" size={20} />} Agregar Paquete al Carrito
                </button>
            </div>
        </Modal>
    );
};

const CartModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { cart, removeFromCart } = useAppContext();
    const total = cart.reduce((sum, item) => sum + item.service.price, 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Carrito de Compras">
            {cart.length === 0 ? (
                <p>Tu carrito está vacío.</p>
            ) : (
                <div className="space-y-4">
                    <ul className="space-y-3 max-h-80 overflow-y-auto">
                        {cart.map(item => (
                            <li key={item.service.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{item.service.name}</p>
                                    <p className="text-sm text-gray-600">{item.provider.brandName}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <p className="font-semibold">${item.service.price.toLocaleString('es-MX')}</p>
                                    <button onClick={() => removeFromCart(item.service.id)} className="text-red-500 hover:text-red-700">
                                        &times;
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="text-right font-bold text-xl pt-4 border-t">
                        Total: <span className="text-primary">${total.toLocaleString('es-MX')}</span>
                    </div>
                    <button className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg">
                        Proceder al Pago
                    </button>
                </div>
            )}
        </Modal>
    );
};

// --- Main HomePage Component ---
const HomePage: React.FC = () => {
  const { providers } = useAppContext();
  const navigate = useNavigate();
  // @ts-ignore
  const { Search, BarChart, CheckCircle, Utensils, Music, Palette, Camera, Building, PartyPopper } = window.LucideReact || {};


  // State for modals
  const [isLocationModalOpen, setLocationModalOpen] = useState(true);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isAiResultsModalOpen, setAiResultsModalOpen] = useState(false);
  const [isCartModalOpen, setCartModalOpen] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for filtering
  const [filter, setFilter] = useState<ServiceCategory | 'All'>('All');

  useEffect(() => {
    // On first load, check if location is known. If not, open modal.
    // This example simplifies logic for demonstration.
    if (!userLocation) {
      setLocationModalOpen(true);
    } else {
      setLocationModalOpen(false);
    }
  }, [userLocation]);

  useEffect(() => {
    if (aiResult) {
      setAiResultsModalOpen(true);
    }
  }, [aiResult]);

  const openProviderDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setDetailsModalOpen(true);
  };
  
  const filteredProviders = useMemo(() => {
    if (filter === 'All') return providers;
    return providers.filter(p => p.category === filter);
  }, [filter, providers]);
  
  const categoryIcons: {[key in ServiceCategory]: React.ReactNode} = {
    [ServiceCategory.FOOD]: Utensils && <Utensils size={24} />,
    [ServiceCategory.MUSIC]: Music && <Music size={24} />,
    [ServiceCategory.DECORATION]: Palette && <Palette size={24} />,
    [ServiceCategory.PHOTOGRAPHY]: Camera && <Camera size={24} />,
    [ServiceCategory.VENUE]: Building && <Building size={24} />,
  };

  return (
    <div className="bg-light">
      <Header onCartClick={() => setCartModalOpen(true)} onProviderClick={() => navigate('/provider')} />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-white text-center py-20 md:py-32">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold text-dark tracking-tight leading-tight">Tu evento ideal, <span className="text-primary">sin esfuerzo.</span></h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Encuentra, compara y reserva a los mejores proveedores para tu fiesta. O deja que nuestra IA cree el paquete perfecto para ti.</p>
            <div className="mt-8 flex justify-center space-x-4">
              <button onClick={() => setAiModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                Crea tu Fiesta con IA
              </button>
              <a href="#explore" className="bg-gray-200 hover:bg-gray-300 text-dark font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                Explorar Proveedores
              </a>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12">¿Por qué FestEasy?</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center">
                <div className="bg-primary text-white rounded-full p-5 mb-4">{Search && <Search size={32} />}</div>
                <h3 className="text-xl font-bold mb-2">Encuentra</h3>
                <p className="text-gray-600">Descubre un mercado curado con los mejores proveedores de tu ciudad.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary text-white rounded-full p-5 mb-4">{BarChart && <BarChart size={32} />}</div>
                <h3 className="text-xl font-bold mb-2">Compara</h3>
                <p className="text-gray-600">Revisa perfiles, precios y opiniones reales para tomar la mejor decisión.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary text-white rounded-full p-5 mb-4">{CheckCircle && <CheckCircle size={32} />}</div>
                <h3 className="text-xl font-bold mb-2">Reserva con Confianza</h3>
                <p className="text-gray-600">Contrata de forma segura y gestiona todo desde un solo lugar.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Explore Section */}
        <section id="explore" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-4">Explora Nuestros Proveedores</h2>
            <p className="text-center text-gray-600 mb-12">Filtra por categoría para encontrar justo lo que necesitas.</p>
            <div className="flex justify-center flex-wrap gap-4 mb-12">
                <button onClick={() => setFilter('All')} className={`px-6 py-2 rounded-full font-semibold transition-colors ${filter === 'All' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Todos</button>
                {Object.values(ServiceCategory).map(cat => (
                    <button key={cat} onClick={() => setFilter(cat)} className={`px-6 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors ${filter === cat ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        {categoryIcons[cat]} {cat}
                    </button>
                ))}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProviders.map(p => <ProviderCard key={p.id} provider={p} onClick={() => openProviderDetails(p)} />)}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Lo que dicen nuestros clientes</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map(t => <TestimonialCard key={t.id} testimonial={t} />)}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col justify-center items-center text-white">
            {PartyPopper && <PartyPopper size={64} className="animate-bounce" />}
            <p className="text-2xl font-bold mt-4">Generando tu fiesta ideal...</p>
            <p className="mt-2 text-lg">Nuestra IA está buscando las mejores opciones para ti.</p>
        </div>
      )}

      {/* Modals */}
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setLocationModalOpen(false)} onLocationSet={setUserLocation} />
      <ProviderDetailsModal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} provider={selectedProvider} />
      <AIPlannerModal isOpen={isAiModalOpen} onClose={() => setAiModalOpen(false)} setAiResult={setAiResult} setIsLoading={setIsLoading}/>
      <AIResultsModal isOpen={isAiResultsModalOpen} onClose={() => {setAiResultsModalOpen(false); setAiResult(null);}} result={aiResult} />
      <CartModal isOpen={isCartModalOpen} onClose={() => setCartModalOpen(false)} />
    </div>
  );
};

export default HomePage;