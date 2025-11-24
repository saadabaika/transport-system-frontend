import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Camions from './components/Camions';
import Employes from './components/Employes';
import Trajets from './components/Trajets';
import Clients from './components/Clients';
import FraisChauffeurs from './components/FraisChauffeurs';
import TransporteursExternes from './components/TransporteursExternes';
import Facturation from './components/Facturation';
import Login from './components/Login';
import GestionUtilisateurs from './components/GestionUtilisateurs';
import MonCompte from './components/MonCompte';
import Destinations from './components/Destinations';
import SituationTVA from './components/SituationTVA';


// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center mt-5">Chargement...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Composant principal avec gestion de l'espacement
function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="App">
      {/* N'afficher la navigation que si ce n'est pas la page de login */}
      {!isLoginPage && <Navigation />}

      {/* Contenu principal avec espacement conditionnel */}
      <div className={!isLoginPage ? "main-content" : "login-page"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/camions" element={
            <ProtectedRoute requiredPermission={{ module: 'camions', action: 'view' }}>
              <Camions />
            </ProtectedRoute>
          } />
          <Route path="/employes" element={
            <ProtectedRoute requiredPermission={{ module: 'employes', action: 'view' }}>
              <Employes />
            </ProtectedRoute>
          } />
          <Route path="/trajets" element={
            <ProtectedRoute requiredPermission={{ module: 'trajets', action: 'view' }}>
              <Trajets />
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute requiredPermission={{ module: 'clients', action: 'view' }}>
              <Clients />
            </ProtectedRoute>
          } />
          <Route path="/frais-chauffeurs" element={
            <ProtectedRoute requiredPermission={{ module: 'frais-chauffeurs', action: 'view' }}>
              <FraisChauffeurs />
            </ProtectedRoute>
          } />
          <Route path="/transporteurs-externes" element={
            <ProtectedRoute requiredPermission={{ module: 'transporteurs-externes', action: 'view' }}>
              <TransporteursExternes />
            </ProtectedRoute>
          } />
          <Route path="/facturation" element={
            <ProtectedRoute requiredPermission={{ module: 'factures', action: 'view' }}>
              <Facturation />
            </ProtectedRoute>
          } />
          // Dans votre composant Routes, ajoutez :
          <Route path="/gestion-utilisateurs" element={
            <ProtectedRoute>
              <GestionUtilisateurs />
            </ProtectedRoute>
          } />
          <Route path="/mon-compte" element={
            <ProtectedRoute>
              <MonCompte />
            </ProtectedRoute>
          } />
          <Route path="/destinations" element={
            <ProtectedRoute>
              <Destinations />
            </ProtectedRoute>
          } />
          <Route path="/situation-tva" element={
            <ProtectedRoute>
              <SituationTVA />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;