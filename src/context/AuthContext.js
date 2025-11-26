import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                // Vérifier que le token est toujours valide
                const response = await authService.getCurrentUser();
                setUser(response.data);
            } catch (error) {
                console.error('Erreur vérification auth:', error);
                logout(); // Déconnecter si token invalide
            }
        } else {
            // Pas de token ou user en localStorage
            setUser(null);
        }
        setLoading(false);
    };

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            const { token, user_id, username, role } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ id: user_id, username, role }));

            setUser({ id: user_id, username, role });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Erreur de connexion'
            };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Erreur logout:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    // ⭐ NOUVELLE FONCTION POUR VÉRIFIER LES PERMISSIONS
    const hasAccess = (module, action = 'view') => {
        if (!user) return false;

        // Admin a tous les droits
        if (user.role === 'admin') return true;

        // Employé a accès à presque tout sauf suppression
        if (user.role === 'employe') {
            if (action === 'delete') return false;
            return true;
        }

        // Agent de facturation - accès limité
        if (user.role === 'facturation') {
            const allowedModules = ['clients', 'factures', 'dashboard', 'mon-compte'];

            // Vérifier si le module est autorisé
            if (!allowedModules.includes(module)) return false;

            // Pas de suppression pour les clients
            if (action === 'delete') return false;

            return true;
        }

        return false;
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isEmploye: user?.role === 'employe',
        isFacturation: user?.role === 'facturation', // ⭐ NOUVEAU
        hasAccess // ⭐ NOUVELLE FONCTION
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};