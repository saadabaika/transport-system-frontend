import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000') + '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token invalide ou expiré
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const camionService = {
    getAll: () => api.get('/camions/'),
    getById: (id) => api.get(`/camions/${id}/`),
    create: (data) => api.post('/camions/', data),
    update: (id, data) => api.put(`/camions/${id}/`, data),
    delete: (id) => api.delete(`/camions/${id}/`),
};

export const employeService = {
    getAll: () => api.get('/employes/'),
    getById: (id) => api.get(`/employes/${id}/`),
    create: (data) => api.post('/employes/', data),
    update: (id, data) => api.put(`/employes/${id}/`, data),
    delete: (id) => api.delete(`/employes/${id}/`),
};


export const destinationService = {
    getAll: () => api.get('/destinations/'),
    getById: (id) => api.get(`/destinations/${id}/`),
    create: (data) => api.post('/destinations/', data),
    update: (id, data) => api.put(`/destinations/${id}/`, data),
    delete: (id) => api.delete(`/destinations/${id}/`),
};

export const trajetService = {
    getAll: () => api.get('/trajets/'),
    create: (data) => api.post('/trajets/', data),
    update: (id, data) => api.put(`/trajets/${id}/`, data),
    delete: (id) => api.delete(`/trajets/${id}/`),
    getCustom: (url) => api.get(url)
};

export const clientService = {
    getAll: () => api.get('/clients/'),
    getById: (id) => api.get(`/clients/${id}/`),
    create: (data) => api.post('/clients/', data),
    update: (id, data) => api.put(`/clients/${id}/`, data),
    delete: (id) => api.delete(`/clients/${id}/`),
};

// Ajouter ces services
export const transporteurExterneService = {
    getAll: () => api.get('/transporteurs-externes/'),
    getById: (id) => api.get(`/transporteurs-externes/${id}/`),
    create: (data) => api.post('/transporteurs-externes/', data),
    update: (id, data) => api.put(`/transporteurs-externes/${id}/`, data),
    delete: (id) => api.delete(`/transporteurs-externes/${id}/`),
};

export const paiementSousTraitanceService = {
    getAll: () => api.get('/paiements-sous-traitance/'),
    getById: (id) => api.get(`/paiements-sous-traitance/${id}/`),
    create: (data) => api.post('/paiements-sous-traitance/', data),
    update: (id, data) => api.put(`/paiements-sous-traitance/${id}/`, data),
    delete: (id) => api.delete(`/paiements-sous-traitance/${id}/`),
};

export const factureService = {
    getAll: () => api.get('/factures/'),
    getById: (id) => api.get(`/factures/${id}/`),
    create: (data) => api.post('/factures/', data),
    update: (id, data) => api.put(`/factures/${id}/`, data),
    delete: (id) => api.delete(`/factures/${id}/`),
    changerStatut: (id, statut) => api.post(`/factures/${id}/changer_statut/`, { statut }),
};

export const chargeCamionService = {
    getAll: () => api.get('/charges-camion/'),
    getByCamion: (camionId) => api.get(`/charges-camion/?camion_id=${camionId}`),
    getById: (id) => api.get(`/charges-camion/${id}/`),
    create: (data) => api.post('/charges-camion/', data),
    update: (id, data) => api.put(`/charges-camion/${id}/`, data),
    delete: (id) => api.delete(`/charges-camion/${id}/`),

    getStatistiquesGlobales: (filters) =>
        api.get('/charges-camion/statistiques_globales/', { params: filters }),
};

// Services d'authentification
export const authService = {
    login: (credentials) => api.post('/auth/login-simple/', credentials),
    logout: () => api.post('/auth/logout-simple/'),
    getCurrentUser: () => api.get('/auth/current_user/'),
};

// Services utilisateurs - MIS À JOUR AVEC TOUTES LES FONCTIONNALITÉS
export const userService = {
    getAll: () => api.get('/users/'),
    getById: (id) => api.get(`/users/${id}/`),
    create: (data) => api.post('/users/', data),
    update: (id, data) => api.patch(`/users/${id}/`, data), // Changé en PATCH pour les updates partielles
    delete: (id) => api.delete(`/users/${id}/`),

    // Nouvelles fonctionnalités
    changePassword: (id, data) => api.post(`/users/${id}/change_password/`, data),
    adminChangePassword: (id, data) => api.post(`/users/${id}/admin_change_password/`, data),
    blockUser: (id) => api.post(`/users/${id}/block_user/`),
    unblockUser: (id) => api.post(`/users/${id}/unblock_user/`),
    forceLogout: (id) => api.post(`/users/${id}/force_logout/`),
};

// NOUVEAU : Services pour "Mon Compte"
export const myAccountService = {
    getProfile: () => api.get('/my-account/'),
    updateProfile: (data) => api.put('/my-account/update_profile/', data),
    changePassword: (data) => api.post('/my-account/change_password/', data),
};

// Ajoutez ces services à votre fichier api.js existant

// Services TVA
export const tvaService = {
    // Opérations
    getOperations: (params) => api.get('/operations-tva/', { params }),
    getOperation: (id) => api.get(`/operations-tva/${id}/`),
    createOperation: (data) => api.post('/operations-tva/', data),
    updateOperation: (id, data) => api.put(`/operations-tva/${id}/`, data),
    deleteOperation: (id) => api.delete(`/operations-tva/${id}/`),

    // Statistiques
    getStats: (params) => api.get('/operations-tva/statistiques_mensuelles/', { params }),

    // Déclarations
    getDeclarations: (params) => api.get('/declarations-tva/', { params }),
    calculerDeclaration: (data) => api.post('/declarations-tva/calculer_declaration/', data),
    declarer: (id, data) => api.post(`/declarations-tva/${id}/declarer/`, data),
    marquerPayee: (id) => api.post(`/declarations-tva/${id}/marquer_payee/`),
};
export default api;