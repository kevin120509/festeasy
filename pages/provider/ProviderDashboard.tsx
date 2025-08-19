import React, { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { BookingRequest, RequestStatus, Service } from '../../types';
import Modal from '../../components/Modal';

const Sidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    // @ts-ignore
    const { BarChart, FileText, User, Settings, LogOut } = window.LucideReact || {};
    const navItems = [
        { name: 'Dashboard', path: '/provider/dashboard', icon: BarChart && <BarChart /> },
        { name: 'Solicitudes', path: 'requests', icon: FileText && <FileText /> },
        { name: 'Mis Servicios', path: 'services', icon: Settings && <Settings /> },
        { name: 'Mi Perfil', path: 'profile', icon: User && <User /> },
    ];
    
    return (
        <div className="w-64 bg-dark text-white flex flex-col">
            <div className="p-6 text-2xl font-bold text-center border-b border-gray-700">
                <a href="/#">🎈 FestEasy</a>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.path === '/provider/dashboard'}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                isActive ? 'bg-primary text-white' : 'hover:bg-gray-700'
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button onClick={onLogout} className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg hover:bg-red-500 transition-colors">
                    {LogOut && <LogOut />}
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

// --- Dashboard Views ---

const DashboardHome: React.FC = () => {
    const { bookingRequests, user, providers } = useAppContext();
    const provider = providers.find(p => p.id === user?.id);

    const pendingRequests = bookingRequests.filter(r => r.service.providerId === user?.id && r.status === RequestStatus.PENDING);
    const totalIncome = bookingRequests
        .filter(r => r.service.providerId === user?.id && r.status === RequestStatus.ACCEPTED)
        .reduce((sum, r) => sum + r.service.price, 0);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-500">Calificación Promedio</h3>
                    <p className="text-4xl font-bold text-primary">{provider?.rating} ★</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-500">Ingresos Totales (Aceptados)</h3>
                    <p className="text-4xl font-bold text-primary">${totalIncome.toLocaleString('es-MX')}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-500">Solicitudes Pendientes</h3>
                    <p className="text-4xl font-bold text-primary">{pendingRequests.length}</p>
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Solicitudes Recientes</h2>
            <div className="bg-white p-4 rounded-lg shadow">
                <ul className="divide-y">
                    {pendingRequests.slice(0, 5).map(req => (
                        <li key={req.id} className="py-3 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{req.customerName} - {req.service.name}</p>
                                <p className="text-sm text-gray-500">{new Date(req.eventDate).toLocaleDateString()}</p>
                            </div>
                            <span className="text-yellow-500 font-medium">{req.status}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const RequestsView: React.FC<{ onSelectRequest: (request: BookingRequest) => void }> = ({ onSelectRequest }) => {
    const { bookingRequests, user } = useAppContext();
    const providerRequests = bookingRequests.filter(r => r.service.providerId === user?.id);
    
    const statusColor: {[key in RequestStatus]: string} = {
        [RequestStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
        [RequestStatus.ACCEPTED]: 'bg-green-100 text-green-800',
        [RequestStatus.REJECTED]: 'bg-red-100 text-red-800',
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Historial de Solicitudes</h1>
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Evento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {providerRequests.map(req => (
                            <tr key={req.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{req.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{req.service.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(req.eventDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor[req.status]}`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => onSelectRequest(req)} className="text-primary hover:text-primary-hover">Ver Detalles</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ServicesView: React.FC = () => {
    const { providers, user, addServiceToProvider } = useAppContext();
    const provider = providers.find(p => p.id === user?.id);
    const [isAdding, setIsAdding] = useState(false);
    const [newService, setNewService] = useState({ name: '', description: '', price: 0 });
    // @ts-ignore
    const { PlusCircle } = window.LucideReact || {};

    const handleAddService = () => {
        if (newService.name && newService.price > 0 && user) {
            addServiceToProvider({ ...newService, providerId: user.id });
            setNewService({ name: '', description: '', price: 0 });
            setIsAdding(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Mis Servicios</h1>
                <button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    {PlusCircle && <PlusCircle size={20} className="mr-2"/>} Añadir Servicio
                </button>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {provider?.services.map(service => (
                        <li key={service.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-lg">{service.name}</p>
                                <p className="text-gray-600">{service.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-xl text-primary">${service.price.toLocaleString('es-MX')}</p>
                                <div className="space-x-2 mt-1">
                                    <button className="text-sm text-blue-500">Editar</button>
                                    <button className="text-sm text-red-500">Eliminar</button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {isAdding && (
                 <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Añadir Nuevo Servicio">
                    <div className="space-y-4">
                        <input type="text" placeholder="Nombre del Servicio" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full border p-2 rounded"/>
                        <textarea placeholder="Descripción" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} className="w-full border p-2 rounded"/>
                        <input type="number" placeholder="Precio" value={newService.price} onChange={e => setNewService({...newService, price: Number(e.target.value)})} className="w-full border p-2 rounded"/>
                        <button onClick={handleAddService} className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-2 px-4 rounded">Guardar Servicio</button>
                    </div>
                 </Modal>
            )}
        </div>
    );
};


const ProfileView: React.FC = () => {
    // This is a preview of the public profile
    const { providers, user } = useAppContext();
    const provider = providers.find(p => p.id === user?.id);
    // @ts-ignore
    const { Star, MapPin } = window.LucideReact || {};

    if (!provider) return <p>No se encontró el perfil del proveedor.</p>;
    
    return (
         <div>
            <h1 className="text-3xl font-bold mb-6">Vista Previa de Mi Perfil</h1>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl mx-auto">
                <img src={provider.gallery[0]} alt={provider.brandName} className="w-full h-64 object-cover" />
                <div className="p-8">
                     <div className="flex items-start mb-4">
                        <img src={provider.logoUrl} alt={`${provider.brandName} logo`} className="w-20 h-20 rounded-full mr-6 border-4 border-white -mt-16" />
                        <div>
                        <h2 className="text-3xl font-bold text-dark">{provider.brandName}</h2>
                        <p className="text-md text-gray-500">{provider.category}</p>
                        </div>
                    </div>
                    <p className="text-gray-700 mb-6">{provider.description}</p>
                    <div className="flex justify-between items-center text-gray-600 border-t pt-4">
                        <div className="flex items-center text-lg">
                            {Star && <Star className="text-yellow-400 mr-2" size={24} fill="currentColor" />}
                            <span className="font-bold">{provider.rating}</span>
                            <span className="ml-1">({provider.reviews} reseñas)</span>
                        </div>
                        <div className="flex items-center text-lg">
                            {MapPin && <MapPin className="mr-2" size={24} />}
                            <span>{provider.location}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequestDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; request: BookingRequest | null }> = ({ isOpen, onClose, request }) => {
    const { updateRequestStatus } = useAppContext();
    // @ts-ignore
    const { Check, X } = window.LucideReact || {};

    if (!request) return null;

    const handleUpdate = (status: RequestStatus) => {
        updateRequestStatus(request.id, status);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalles de la Solicitud">
            <div className="space-y-4">
                <p><strong>Cliente:</strong> {request.customerName}</p>
                <p><strong>Fecha del Evento:</strong> {new Date(request.eventDate).toLocaleDateString()}</p>
                <p><strong>Tipo de Evento:</strong> {request.eventType}</p>
                <p><strong>Ubicación:</strong> {request.location}</p>
                <p><strong># de Invitados:</strong> {request.guests}</p>
                <div className="bg-gray-100 p-3 rounded">
                    <p><strong>Servicio Solicitado:</strong> {request.service.name}</p>
                    <p className="font-bold"><strong>Costo:</strong> ${request.service.price.toLocaleString('es-MX')}</p>
                </div>
                {request.status === RequestStatus.PENDING && (
                    <div className="flex space-x-4 pt-4">
                        <button onClick={() => handleUpdate(RequestStatus.ACCEPTED)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                            {Check && <Check className="mr-2" />} Aceptar
                        </button>
                        <button onClick={() => handleUpdate(RequestStatus.REJECTED)} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                            {X && <X className="mr-2" />} Rechazar
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};


// --- Main Dashboard Component ---

const ProviderDashboard: React.FC = () => {
    const { logout } = useAppContext();
    const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);

    return (
        <div className="flex h-screen bg-light">
            <Sidebar onLogout={logout} />
            <main className="flex-1 p-8 overflow-y-auto">
                <Routes>
                    <Route index element={<DashboardHome />} />
                    <Route path="requests" element={<RequestsView onSelectRequest={setSelectedRequest} />} />
                    <Route path="services" element={<ServicesView />} />
                    <Route path="profile" element={<ProfileView />} />
                </Routes>
            </main>
            <RequestDetailsModal 
                isOpen={!!selectedRequest} 
                onClose={() => setSelectedRequest(null)} 
                request={selectedRequest} 
            />
        </div>
    );
};

export default ProviderDashboard;