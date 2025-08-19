import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const ProviderAuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, user } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    // If user is already logged in as provider, redirect to dashboard
    if (user && user.type === 'provider') {
        return <Navigate to="/provider/dashboard" replace />;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock authentication
        if (email) {
            login(email, 'provider');
            navigate('/provider/dashboard');
        } else {
            alert('Por favor, introduce un email.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            <div className="text-center mb-10">
                <a href="/#" className="text-4xl font-bold text-primary">🎈 FestEasy</a>
                <h1 className="text-4xl font-extrabold text-dark mt-4">Haz crecer tu negocio de eventos</h1>
                <p className="text-gray-600 mt-2">Únete a nuestra comunidad de proveedores y conecta con miles de clientes.</p>
            </div>
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-center text-dark mb-6">{isRegister ? 'Crea tu cuenta de Proveedor' : 'Inicia Sesión'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                             value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    {isRegister && (
                         <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                    )}
                    <div>
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            {isRegister ? 'Registrarme' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600">
                    {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                    <button onClick={() => setIsRegister(!isRegister)} className="font-medium text-primary hover:text-primary-hover ml-1">
                        {isRegister ? 'Inicia Sesión' : 'Regístrate'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default ProviderAuthPage;