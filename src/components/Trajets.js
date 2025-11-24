import React, { useState, useEffect , useRef} from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Form, Row, Col, Card, Badge, Modal
} from 'react-bootstrap';
import {
    trajetService,
    camionService,
    employeService,
    clientService,
    destinationService,
    transporteurExterneService
} from '../services/api';

function Trajets() {
    const formRef = useRef(null);
    const [trajets, setTrajets] = useState([]);
    const [trajetsFiltres, setTrajetsFiltres] = useState([]);
    const [camions, setCamions] = useState([]);
    const [chauffeurs, setChauffeurs] = useState([]);
    const [clients, setClients] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [transporteursExternes, setTransporteursExternes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [trajetSelectionne, setTrajetSelectionne] = useState(null);
    const [editingTrajet, setEditingTrajet] = useState(null);

    const [filtres, setFiltres] = useState({
        client: '', chauffeur: '', date_debut: '', date_fin: '',
        type_trajet: '', type_service: '', type_sous_traitance: '', numero_conteneur: ''
    });

    const [formData, setFormData] = useState({
        date: '', camion: '', chauffeur: '', client: '', destination: '',
        n_conteneurs: 1, numeros_conteneurs: '', prix_trajet: '', frais_deplacement: '',
        type_trajet: 'facture', type_service: 'ars_distribution', type_sous_traitance: 'interne',
        transporteur_externe: '', prix_sous_traitance: '', statut_paiement_sous_traitance: 'non_paye',
        frais_supplementaires_list: [], remarques: '', statut_paiement_frais: 'non_paye'
    });

    const [nouveauFrais, setNouveauFrais] = useState({ nom: '', montant: '' });

    // Fonctions utilitaires pour les badges de date
    const isToday = (dateString) => {
        const today = new Date().toISOString().split('T')[0];
        return dateString === today;
    };

    const isYesterday = (dateString) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return dateString === yesterday.toISOString().split('T')[0];
    };

    useEffect(() => { fetchAllData(); }, []);
    useEffect(() => { appliquerFiltres(); }, [trajets, filtres]);

    const fetchAllData = async () => {
        try {
            const [trajetsRes, camionsRes, employesRes, clientsRes, destinationsRes, transporteursRes] = await Promise.all([
                trajetService.getAll(), camionService.getAll(), employeService.getAll(),
                clientService.getAll(), destinationService.getAll(), transporteurExterneService.getAll()
            ]);

            setTrajets(trajetsRes.data);
            setCamions(camionsRes.data);
            // ⭐ FILTRER SEULEMENT LES CHAUFFEURS ACTIFS
            setChauffeurs(employesRes.data.filter(emp =>
                emp.type_employe === 'chauffeur' && emp.statut === 'actif'
            ));
            setClients(clientsRes.data);
            setDestinations(destinationsRes.data);
            setTransporteursExternes(transporteursRes.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const appliquerFiltres = () => {
        let trajetsFiltres = [...trajets];

        // Appliquer les filtres
        if (filtres.client) trajetsFiltres = trajetsFiltres.filter(t => t.client == filtres.client);
        if (filtres.chauffeur) trajetsFiltres = trajetsFiltres.filter(t => t.chauffeur == filtres.chauffeur);
        if (filtres.date_debut) trajetsFiltres = trajetsFiltres.filter(t => t.date >= filtres.date_debut);
        if (filtres.date_fin) trajetsFiltres = trajetsFiltres.filter(t => t.date <= filtres.date_fin);
        if (filtres.type_trajet) trajetsFiltres = trajetsFiltres.filter(t => t.type_trajet === filtres.type_trajet);
        if (filtres.type_service) trajetsFiltres = trajetsFiltres.filter(t => t.type_service === filtres.type_service);
        if (filtres.type_sous_traitance) trajetsFiltres = trajetsFiltres.filter(t => t.type_sous_traitance === filtres.type_sous_traitance);
        if (filtres.numero_conteneur) {
            trajetsFiltres = trajetsFiltres.filter(t =>
                t.numeros_conteneurs &&
                t.numeros_conteneurs.toLowerCase().includes(filtres.numero_conteneur.toLowerCase())
            );
        }

        // TRIER PAR DATE DÉCROISSANTE (les plus récents en premier)
        trajetsFiltres.sort((a, b) => new Date(b.date) - new Date(a.date));

        setTrajetsFiltres(trajetsFiltres);
    };

    const handleFiltreChange = (e) => {
        const { name, value } = e.target;
        setFiltres(prev => ({ ...prev, [name]: value }));
    };

    const reinitialiserFiltres = () => {
        setFiltres({ client: '', chauffeur: '', date_debut: '', date_fin: '', type_trajet: '', type_service: '', type_sous_traitance: '', numero_conteneur: '' });
    };

    const handleShowDetails = (trajet) => {
        setTrajetSelectionne(trajet);
        setShowDetails(true);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setTrajetSelectionne(null);
    };

    const handleShowForm = (trajet = null) => {
        if (trajet) {
            setEditingTrajet(trajet);
            setFormData({
                date: trajet.date, camion: trajet.camion, chauffeur: trajet.chauffeur,
                client: trajet.client, destination: trajet.destination, n_conteneurs: trajet.n_conteneurs,
                numeros_conteneurs: trajet.numeros_conteneurs || '', prix_trajet: trajet.prix_trajet,
                frais_deplacement: trajet.frais_deplacement, type_trajet: trajet.type_trajet,
                type_service: trajet.type_service, type_sous_traitance: trajet.type_sous_traitance || 'interne',
                transporteur_externe: trajet.transporteur_externe || '', prix_sous_traitance: trajet.prix_sous_traitance || '',
                statut_paiement_sous_traitance: trajet.statut_paiement_sous_traitance || 'non_paye',
                frais_supplementaires_list: trajet.frais_supplementaires_list || [], remarques: trajet.remarques || '',
                statut_paiement_frais: trajet.statut_paiement_frais
            });
        } else {
            setEditingTrajet(null);
            setFormData({
                date: new Date().toISOString().split('T')[0], camion: '', chauffeur: '', client: '', destination: '',
                n_conteneurs: 1, numeros_conteneurs: '', prix_trajet: '', frais_deplacement: '',
                type_trajet: 'facture', type_service: 'ars_distribution', type_sous_traitance: 'interne',
                transporteur_externe: '', prix_sous_traitance: '', statut_paiement_sous_traitance: 'non_paye',
                frais_supplementaires_list: [], remarques: '', statut_paiement_frais: 'non_paye'
            });
        }
        setNouveauFrais({ nom: '', montant: '' });
        setError('');
        setShowForm(true);
    // ⭐ AJOUTEZ CE CODE POUR LE DÉFILEMENT AUTOMATIQUE
    setTimeout(() => {
        formRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);

    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTrajet(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const submissionData = {
                date: formData.date,
                client: formData.client,
                destination: formData.destination,
                n_conteneurs: parseInt(formData.n_conteneurs) || 1,
                numeros_conteneurs: formData.numeros_conteneurs,
                prix_trajet: parseFloat(formData.prix_trajet) || 0,
                type_trajet: formData.type_trajet,
                type_service: formData.type_service,
                type_sous_traitance: formData.type_sous_traitance,
                transporteur_externe: formData.type_sous_traitance !== 'interne' ? formData.transporteur_externe : null,
                frais_supplementaires_list: formData.frais_supplementaires_list,
                remarques: formData.remarques,
                statut_paiement_frais: formData.statut_paiement_frais
            };

            // CORRECTION : Logique différente selon le type de sous-traitance
            if (formData.type_sous_traitance === 'je_donne') {
                // Pour "Je donne" : envoyer explicitement null
                submissionData.camion = null;
                submissionData.chauffeur = null;
                submissionData.frais_deplacement = 0;
                submissionData.prix_sous_traitance = parseFloat(formData.prix_sous_traitance) || 0;
                submissionData.statut_paiement_sous_traitance = formData.statut_paiement_sous_traitance;
            } else if (formData.type_sous_traitance === 'je_recois') {
                // Pour "Je reçois" : inclure camion, chauffeur ET les infos de sous-traitance
                submissionData.camion = formData.camion;
                submissionData.chauffeur = formData.chauffeur;
                submissionData.frais_deplacement = parseFloat(formData.frais_deplacement) || 0;
                submissionData.prix_sous_traitance = parseFloat(formData.prix_sous_traitance) || 0;
                submissionData.statut_paiement_sous_traitance = formData.statut_paiement_sous_traitance;
            } else {
                // Pour "Interne" : pas de sous-traitance
                submissionData.camion = formData.camion;
                submissionData.chauffeur = formData.chauffeur;
                submissionData.frais_deplacement = parseFloat(formData.frais_deplacement) || 0;
                submissionData.prix_sous_traitance = 0;
                submissionData.statut_paiement_sous_traitance = 'non_paye';
            }

            console.log('Données envoyées:', submissionData);

            if (editingTrajet) {
                await trajetService.update(editingTrajet.id, submissionData);
            } else {
                await trajetService.create(submissionData);
            }

            fetchAllData();
            handleCloseForm();
        } catch (error) {
            console.log('Error details:', error);
            if (error.response?.data) {
                const errors = error.response.data;
                let errorMessage = 'Erreur de validation des données: ';
                Object.keys(errors).forEach(key => {
                    errorMessage += `${key}: ${errors[key].join(', ')}; `;
                });
                setError(errorMessage);
            } else {
                setError('Erreur de connexion au serveur');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?')) {
            try {
                await trajetService.delete(id);
                fetchAllData();
            } catch (error) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'destination') {
            const selectedDestination = destinations.find(dest => dest.id == value);
            if (selectedDestination) {
                setFormData(prev => ({
                    ...prev,
                    frais_deplacement: formData.type_sous_traitance === 'je_donne' ? 0 : selectedDestination.frais_deplacement
                }));
            }
        }

        // Réinitialiser les champs quand on change le type de sous-traitance
        if (name === 'type_sous_traitance') {
            if (value === 'je_donne') {
                setFormData(prev => ({
                    ...prev,
                    camion: '',
                    chauffeur: '',
                    frais_deplacement: 0,
                    prix_sous_traitance: '',
                    statut_paiement_sous_traitance: 'non_paye'
                }));
            } else if (value === 'je_recois') {
                setFormData(prev => ({
                    ...prev,
                    prix_sous_traitance: '',
                    statut_paiement_sous_traitance: 'non_paye'
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    transporteur_externe: '',
                    prix_sous_traitance: '',
                    statut_paiement_sous_traitance: 'non_paye'
                }));
            }
        }
    };

    const handleAjouterFrais = () => {
        if (nouveauFrais.nom && nouveauFrais.montant) {
            const nouveauxFrais = [...formData.frais_supplementaires_list, {
                nom: nouveauFrais.nom, montant: parseFloat(nouveauFrais.montant) || 0
            }];
            setFormData(prev => ({ ...prev, frais_supplementaires_list: nouveauxFrais }));
            setNouveauFrais({ nom: '', montant: '' });
        }
    };

    const handleSupprimerFrais = (index) => {
        const nouveauxFrais = formData.frais_supplementaires_list.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, frais_supplementaires_list: nouveauxFrais }));
    };

    const getTypeBadge = (type) => type === 'facture' ? 'success' : 'warning';
    const getServiceBadge = (service) => service === 'ars_distribution' ? 'info' : 'primary';
    const getSousTraitanceBadge = (type) => {
        const types = {
            'interne': { bg: 'secondary', text: 'Interne' },
            'je_donne': { bg: 'warning', text: 'Je donne' },
            'je_recois': { bg: 'info', text: 'Je reçois' }
        };
        return types[type] || { bg: 'secondary', text: type };
    };
    const getPaiementBadge = (statut) => {
        const statuts = { 'paye': 'success', 'non_paye': 'danger', 'partiel': 'warning' };
        return statuts[statut] || 'secondary';
    };
    const calculerTotalFraisSupplementaires = (fraisList = []) => {
        return fraisList.reduce((total, frais) => total + (parseFloat(frais.montant) || 0), 0);
    };

    // Calcul du total pour l'affichage (exclut les frais pour "Je donne")
    const calculerTotalAffichage = (trajet) => {
        if (trajet.type_sous_traitance === 'je_donne') {
            return parseFloat(trajet.prix_trajet || 0);
        } else {
            return parseFloat(trajet.prix_trajet || 0) +
                parseFloat(trajet.frais_deplacement || 0) +
                parseFloat(trajet.total_frais_supplementaires || 0);
        }
    };

    const stats = {
        totalTrajets: trajetsFiltres.length,
        totalRevenus: trajetsFiltres.reduce((sum, t) => sum + parseFloat(t.prix_trajet || 0), 0),
        trajetsFactures: trajetsFiltres.filter(t => t.type_trajet === 'facture').length,
        trajetsNonFactures: trajetsFiltres.filter(t => t.type_trajet === 'non_facture').length,
        totalFraisSupplementaires: trajetsFiltres.reduce((sum, t) => sum + parseFloat(t.total_frais_supplementaires || 0), 0),
        trajetsInterne: trajetsFiltres.filter(t => t.type_sous_traitance === 'interne').length,
        trajetsJeDonne: trajetsFiltres.filter(t => t.type_sous_traitance === 'je_donne').length,
        trajetsJeRecois: trajetsFiltres.filter(t => t.type_sous_traitance === 'je_recois').length
    };

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container fluid className="px-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Gestion des Trajets</h1>
                <Button variant="primary" onClick={() => handleShowForm()} disabled={showForm}>
                    + Nouveau Trajet
                </Button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Card className="mb-4">
                <Card.Header><h5 className="mb-0">🔍 Filtres de Recherche</h5></Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}><Form.Group className="mb-3"><Form.Label>Client</Form.Label>
                            <Form.Select name="client" value={filtres.client} onChange={handleFiltreChange}>
                                <option value="">Tous les clients</option>
                                {clients.map(client => <option key={client.id} value={client.id}>{client.nom}</option>)}
                            </Form.Select></Form.Group></Col>
                        <Col md={2}><Form.Group className="mb-3"><Form.Label>Chauffeur</Form.Label>
                            <Form.Select name="chauffeur" value={filtres.chauffeur} onChange={handleFiltreChange}>
                                <option value="">Tous les chauffeurs</option>
                                {chauffeurs.map(chauffeur => <option key={chauffeur.id} value={chauffeur.id}>{chauffeur.prenom} {chauffeur.nom}</option>)}
                            </Form.Select></Form.Group></Col>
                        <Col md={2}><Form.Group className="mb-3"><Form.Label>Date Début</Form.Label>
                            <Form.Control type="date" name="date_debut" value={filtres.date_debut} onChange={handleFiltreChange} /></Form.Group></Col>
                        <Col md={2}><Form.Group className="mb-3"><Form.Label>Date Fin</Form.Label>
                            <Form.Control type="date" name="date_fin" value={filtres.date_fin} onChange={handleFiltreChange} /></Form.Group></Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Numéro Conteneur</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="numero_conteneur"
                                    value={filtres.numero_conteneur}
                                    onChange={handleFiltreChange}
                                    placeholder="Rechercher par numéro..."
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={3}><Form.Group className="mb-3"><Form.Label>Sous-traitance</Form.Label>
                            <Form.Select name="type_sous_traitance" value={filtres.type_sous_traitance} onChange={handleFiltreChange}>
                                <option value="">Tous</option>
                                <option value="interne">Interne</option>
                                <option value="je_donne">Je donne</option>
                                <option value="je_recois">Je reçois</option>
                            </Form.Select></Form.Group></Col>
                        <Col md={3}><Form.Group className="mb-3"><Form.Label>Type Trajet</Form.Label>
                            <Form.Select name="type_trajet" value={filtres.type_trajet} onChange={handleFiltreChange}>
                                <option value="">Tous</option>
                                <option value="facture">Facturé</option>
                                <option value="non_facture">Non Facturé</option>
                            </Form.Select></Form.Group></Col>
                        <Col md={3}><Form.Group className="mb-3"><Form.Label>Type Service</Form.Label>
                            <Form.Select name="type_service" value={filtres.type_service} onChange={handleFiltreChange}>
                                <option value="">Tous</option>
                                <option value="ars_distribution">ARS Distribution</option>
                                <option value="arn_logistique">ARN Logistique</option>
                            </Form.Select></Form.Group></Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button variant="outline-secondary" onClick={reinitialiserFiltres}>🔄 Réinitialiser</Button>
                            <div className="ms-2 text-muted"><small>{trajetsFiltres.length} trajet(s) trouvé(s)</small></div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {showForm && (
                <Card className="mb-4" ref={formRef}>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{editingTrajet ? 'Modifier le Trajet' : 'Nouveau Trajet'}</h5>
                        <Button variant="outline-secondary" size="sm" onClick={handleCloseForm}>✕</Button>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={3}><Form.Group className="mb-3"><Form.Label>Date *</Form.Label>
                                    <Form.Control type="date" name="date" value={formData.date} onChange={handleChange} required disabled={saving} /></Form.Group></Col>
                                <Col md={3}><Form.Group className="mb-3"><Form.Label>Type de Trajet *</Form.Label>
                                    <Form.Select name="type_trajet" value={formData.type_trajet} onChange={handleChange} required disabled={saving}>
                                        <option value="facture">Facturé</option>
                                        <option value="non_facture">Non Facturé</option>
                                    </Form.Select></Form.Group></Col>
                                <Col md={3}><Form.Group className="mb-3"><Form.Label>Type de Service *</Form.Label>
                                    <Form.Select name="type_service" value={formData.type_service} onChange={handleChange} required disabled={saving}>
                                        <option value="ars_distribution">ARS Distribution</option>
                                        <option value="arn_logistique">ARN Logistique</option>
                                    </Form.Select></Form.Group></Col>
                                <Col md={3}><Form.Group className="mb-3"><Form.Label>Type de Sous-traitance *</Form.Label>
                                    <Form.Select name="type_sous_traitance" value={formData.type_sous_traitance} onChange={handleChange} required disabled={saving}>
                                        <option value="interne">Trajet Interne</option>
                                        <option value="je_donne">Je donne à un transporteur</option>
                                        <option value="je_recois">Je reçois d'un transporteur</option>
                                    </Form.Select></Form.Group></Col>
                            </Row>

                            {formData.type_sous_traitance !== 'interne' && (
                                <Row>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Transporteur Externe *</Form.Label>
                                        <Form.Select name="transporteur_externe" value={formData.transporteur_externe} onChange={handleChange} required disabled={saving}>
                                            <option value="">Sélectionner un transporteur</option>
                                            {transporteursExternes.map(transporteur => <option key={transporteur.id} value={transporteur.id}>{transporteur.nom} ({transporteur.ice})</option>)}
                                        </Form.Select></Form.Group></Col>
                                </Row>
                            )}

                            {/* Section Camion et Chauffeur - Masquée pour "Je donne" */}
                            {formData.type_sous_traitance !== 'je_donne' && (
                                <Row>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Camion *</Form.Label>
                                        <Form.Select name="camion" value={formData.camion} onChange={handleChange} required disabled={saving}>
                                            <option value="">Sélectionner un camion</option>
                                            {camions.map(camion => <option key={camion.id} value={camion.id}>{camion.immatriculation} - {camion.marque} {camion.modele}</option>)}
                                        </Form.Select></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Chauffeur *</Form.Label>
                                        <Form.Select name="chauffeur" value={formData.chauffeur} onChange={handleChange} required disabled={saving}>
                                            <option value="">Sélectionner un chauffeur</option>
                                            {chauffeurs.map(chauffeur => <option key={chauffeur.id} value={chauffeur.id}>{chauffeur.prenom} {chauffeur.nom}</option>)}
                                        </Form.Select></Form.Group></Col>
                                </Row>
                            )}

                            <Row>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label>Client *</Form.Label>
                                    <Form.Select name="client" value={formData.client} onChange={handleChange} required disabled={saving}>
                                        <option value="">Sélectionner un client</option>
                                        {clients.map(client => <option key={client.id} value={client.id}>{client.nom} ({client.ice})</option>)}
                                    </Form.Select></Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label>Destination *</Form.Label>
                                    <Form.Select name="destination" value={formData.destination} onChange={handleChange} required disabled={saving}>
                                        <option value="">Sélectionner une destination</option>
                                        {destinations.map(destination => <option key={destination.id} value={destination.id}>{destination.ville} ({destination.frais_deplacement} DH)</option>)}
                                    </Form.Select></Form.Group></Col>
                            </Row>

                            <Row>
                                <Col md={4}><Form.Group className="mb-3"><Form.Label>Nombre de Conteneurs *</Form.Label>
                                    <Form.Control type="number" name="n_conteneurs" value={formData.n_conteneurs} onChange={handleChange} required min="1" disabled={saving} /></Form.Group></Col>
                                <Col md={8}><Form.Group className="mb-3"><Form.Label>Numéros de Conteneurs</Form.Label>
                                    <Form.Control type="text" name="numeros_conteneurs" value={formData.numeros_conteneurs} onChange={handleChange} placeholder="Ex: CONT-001, CONT-002, CONT-003" disabled={saving} />
                                    <Form.Text className="text-muted">Séparez par des virgules pour plusieurs conteneurs</Form.Text>
                                </Form.Group></Col>
                            </Row>

                            <Row>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label>Prix du Trajet (DH)</Form.Label>
                                    <Form.Control type="number" name="prix_trajet" value={formData.prix_trajet} onChange={handleChange} min="0" step="0.01" disabled={saving} placeholder="Optionnel" /></Form.Group></Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Frais Déplacement (DH)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="frais_deplacement"
                                            value={formData.frais_deplacement}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            disabled={saving || formData.type_sous_traitance === 'je_donne'}
                                            placeholder={formData.type_sous_traitance === 'je_donne' ? "Non applicable" : "Optionnel"}
                                        />
                                        {formData.type_sous_traitance === 'je_donne' && (
                                            <Form.Text className="text-muted">
                                                Non applicable pour les trajets "Je donne"
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>

                            {formData.type_sous_traitance === 'je_donne' && (
                                <Row>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Prix Sous-traitance (DH)</Form.Label>
                                        <Form.Control type="number" name="prix_sous_traitance" value={formData.prix_sous_traitance} onChange={handleChange} min="0" step="0.01" disabled={saving} placeholder="Optionnel" /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Statut Paiement Sous-traitance</Form.Label>
                                        <Form.Select name="statut_paiement_sous_traitance" value={formData.statut_paiement_sous_traitance} onChange={handleChange} disabled={saving}>
                                            <option value="non_paye">Non Payé</option>
                                            <option value="partiel">Partiel</option>
                                            <option value="paye">Payé</option>
                                        </Form.Select></Form.Group></Col>
                                </Row>
                            )}

                            {/* AJOUTEZ CETTE SECTION POUR "JE RECOIS" */}
                            {formData.type_sous_traitance === 'je_recois' && (
                                <Row>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Prix Sous-traitance (DH)</Form.Label>
                                        <Form.Control type="number" name="prix_sous_traitance" value={formData.prix_sous_traitance} onChange={handleChange} min="0" step="0.01" disabled={saving} placeholder="Prix à recevoir" /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Statut Paiement Sous-traitance</Form.Label>
                                        <Form.Select name="statut_paiement_sous_traitance" value={formData.statut_paiement_sous_traitance} onChange={handleChange} disabled={saving}>
                                            <option value="non_paye"> Non Payé</option>
                                            <option value="partiel">Partiel</option>
                                            <option value="paye">Payé</option>
                                        </Form.Select></Form.Group></Col>
                                </Row>
                            )}

                            {/* Frais supplémentaires - Masqués pour "Je donne" */}
                            {(formData.type_sous_traitance === 'interne' || formData.type_sous_traitance === 'je_recois') && (
                                <Card className="mb-3">
                                    <Card.Header><h6 className="mb-0">💸 Frais Supplémentaires du Chauffeur</h6></Card.Header>
                                    <Card.Body>
                                        <Row className="mb-3">
                                            <Col md={5}><Form.Control type="text" placeholder="Nom du frais (ex: Gardienne, Dépannage...)" value={nouveauFrais.nom} onChange={(e) => setNouveauFrais(prev => ({ ...prev, nom: e.target.value }))} disabled={saving} /></Col>
                                            <Col md={4}><Form.Control type="number" placeholder="Montant (DH)" value={nouveauFrais.montant} onChange={(e) => setNouveauFrais(prev => ({ ...prev, montant: e.target.value }))} min="0" step="0.01" disabled={saving} /></Col>
                                            <Col md={3}><Button variant="outline-primary" onClick={handleAjouterFrais} disabled={saving || !nouveauFrais.nom || !nouveauFrais.montant}>+ Ajouter</Button></Col>
                                        </Row>
                                        {formData.frais_supplementaires_list.length > 0 && (
                                            <>
                                                <Table size="sm" bordered>
                                                    <thead><tr><th>Nom du Frais</th><th width="120">Montant (DH)</th><th width="80">Action</th></tr></thead>
                                                    <tbody>
                                                        {formData.frais_supplementaires_list.map((frais, index) => (
                                                            <tr key={index}>
                                                                <td>{frais.nom}</td>
                                                                <td>{parseFloat(frais.montant).toLocaleString()} DH</td>
                                                                <td><Button variant="outline-danger" size="sm" onClick={() => handleSupprimerFrais(index)} disabled={saving}>🗑️</Button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                                <div className="text-end"><strong>Total Frais Supplémentaires: {calculerTotalFraisSupplementaires(formData.frais_supplementaires_list).toLocaleString()} DH</strong></div>
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            <Row>
                                <Col md={6}><Form.Group className="mb-3"><Form.Label>État Paiement Frais</Form.Label>
                                    <Form.Select name="statut_paiement_frais" value={formData.statut_paiement_frais} onChange={handleChange} disabled={saving}>
                                        <option value="non_paye">Non Payé</option>
                                        <option value="partiel">Partiel</option>
                                        <option value="paye">Payé</option>
                                    </Form.Select></Form.Group></Col>
                            </Row>

                            <Form.Group className="mb-3"><Form.Label>Remarques</Form.Label>
                                <Form.Control as="textarea" rows={3} name="remarques" value={formData.remarques} onChange={handleChange} placeholder="Remarques supplémentaires sur ce trajet..." disabled={saving} />
                            </Form.Group>

                            <div className="d-flex gap-2 mt-3">
                                <Button variant="primary" type="submit" disabled={saving}>
                                    {saving ? <><Spinner animation="border" size="sm" className="me-2" />Enregistrement...</> : (editingTrajet ? 'Modifier' : 'Créer')}
                                </Button>
                                <Button variant="secondary" onClick={handleCloseForm} disabled={saving}>Annuler</Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            <Row className="mb-4">
                <Col md={2}><Card className="text-center border-primary"><Card.Body><Card.Title>📦 Total</Card.Title><h4>{stats.totalTrajets}</h4></Card.Body></Card></Col>
                <Col md={2}><Card className="text-center border-success"><Card.Body><Card.Title>💰 Revenus</Card.Title><h4>{stats.totalRevenus.toLocaleString()} DH</h4></Card.Body></Card></Col>
                <Col md={2}><Card className="text-center border-info"><Card.Body><Card.Title>🧾 Facturés</Card.Title><h4>{stats.trajetsFactures}</h4></Card.Body></Card></Col>
                <Col md={2}><Card className="text-center border-secondary"><Card.Body><Card.Title>🏠 Interne</Card.Title><h4>{stats.trajetsInterne}</h4></Card.Body></Card></Col>
                <Col md={2}><Card className="text-center border-warning"><Card.Body><Card.Title>📤 Je donne</Card.Title><h4>{stats.trajetsJeDonne}</h4></Card.Body></Card></Col>
                <Col md={2}><Card className="text-center border-info"><Card.Body><Card.Title>📥 Je reçois</Card.Title><h4>{stats.trajetsJeRecois}</h4></Card.Body></Card></Col>
            </Row>

            <Card>
                <Card.Body>
                    {/* Conteneur avec scroll fixe */}
                    <div style={{
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        position: 'relative'
                    }}>
                        <Table striped bordered hover responsive style={{ minWidth: '1400px' }}>
                            <thead className="table-dark" style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                backgroundColor: '#212529'
                            }}>
                                <tr>
                                    <th width="130">Date</th>
                                    <th width="150">Client</th>
                                    <th width="150">Destination</th>
                                    <th width="120">Sous-traitance</th>
                                    <th width="100">Transporteur</th>
                                    <th width="100">Service</th>
                                    <th width="120">Camion</th>
                                    <th width="120">Conteneurs</th>
                                    <th width="120">Prix Trajet</th>
                                    <th width="100">Prix Sous-traitance</th>
                                    {/*<th width="100">Type</th> */}
                                    {/* <th width="100">Frais+</th>*/}
                                    <th width="100">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trajetsFiltres.map((trajet) => {
                                    const totalFraisSupplementaires = parseFloat(trajet.total_frais_supplementaires || 0);
                                    const sousTraitance = getSousTraitanceBadge(trajet.type_sous_traitance);
                                    return (
                                        <tr key={trajet.id} style={{ cursor: 'pointer' }} onClick={() => handleShowDetails(trajet)}>
                                            <td>
                                                <strong>{trajet.date}</strong>
                                                {isToday(trajet.date) && <Badge bg="success" className="ms-1">Aujourd'hui</Badge>}
                                                {isYesterday(trajet.date) && <Badge bg="info" className="ms-1">Hier</Badge>}
                                            </td>
                                            <td><strong>{trajet.client_details?.nom || `Client ${trajet.client}`}</strong></td>
                                            <td>{trajet.destination_details?.ville || `Destination ${trajet.destination}`}</td>
                                            <td><Badge bg={sousTraitance.bg}>{sousTraitance.text}</Badge></td>
                                            <td>{trajet.transporteur_externe_details?.nom || '-'}</td>
                                            <td><Badge bg={getServiceBadge(trajet.type_service)}>{trajet.type_service === 'ars_distribution' ? 'ARS Dist' : 'ARN Log'}</Badge></td>
                                            <td>{trajet.camion_details?.immatriculation || `Camion ${trajet.camion}`}</td>
                                            <td className="text-center">
                                                {/*   <Badge bg="info">{trajet.n_conteneurs}</Badge> */}
                                                {trajet.numeros_conteneurs && (
                                                    <div>
                                                        <small className="text-dark" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#5D4037' }}>
                                                            {trajet.numeros_conteneurs}
                                                        </small>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <strong className={trajet.prix_trajet > 0 ? 'text-success' : 'text-muted'}>
                                                    {parseFloat(trajet.prix_trajet).toLocaleString()} DH
                                                </strong>
                                            </td>
                                            <td>
                                                {trajet.prix_sous_traitance > 0 ? (
                                                    <Badge bg={trajet.type_sous_traitance === 'je_donne' ? 'danger' : 'success'}>
                                                        {parseFloat(trajet.prix_sous_traitance).toLocaleString()} DH
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            {/* 
                                            <td>
                                                <Badge bg={getTypeBadge(trajet.type_trajet)}>
                                                    {trajet.type_trajet === 'facture' ? 'Facturé' : 'Non Facturé'}
                                                </Badge>
                                            </td>
                                            */}
                                            {/* 
                                            <td>

                                                {totalFraisSupplementaires > 0 ? (
                                                    <Badge bg="secondary">{totalFraisSupplementaires.toLocaleString()} DH</Badge>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                             */}

                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="btn-group" role="group">
                                                    <Button variant="outline-info" size="sm" onClick={() => handleShowDetails(trajet)} title="Voir détails">
                                                        👁️
                                                    </Button>
                                                    <Button variant="outline-primary" size="sm" onClick={() => handleShowForm(trajet)} disabled={showForm} title="Modifier">
                                                        ✏️
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(trajet.id)} disabled={showForm} title="Supprimer">
                                                        🗑️
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                    {trajetsFiltres.length === 0 && (
                        <div className="text-center text-muted py-4">
                            <h5>Aucun trajet trouvé</h5>
                            <p>Modifiez vos filtres ou créez un nouveau trajet</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {showDetails && trajetSelectionne && (
                <Modal show={showDetails} onHide={handleCloseDetails} size="lg" enforceFocus={false}>
                    <Modal.Header closeButton><Modal.Title>📋 Détails du Trajet #{trajetSelectionne.id}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}><Card className="mb-3"><Card.Header><h6 className="mb-0">📅 Informations Générales</h6></Card.Header><Card.Body>
                                <p><strong>Date:</strong> {trajetSelectionne.date}</p>
                                <p><strong>Type de Trajet:</strong><Badge bg={getTypeBadge(trajetSelectionne.type_trajet)} className="ms-2">{trajetSelectionne.type_trajet === 'facture' ? 'Facturé' : 'Non Facturé'}</Badge></p>
                                <p><strong>Type de Service:</strong><Badge bg={getServiceBadge(trajetSelectionne.type_service)} className="ms-2">{trajetSelectionne.type_service === 'ars_distribution' ? 'ARS Distribution' : 'ARN Logistique'}</Badge></p>
                                <p><strong>Type de Sous-traitance:</strong><Badge bg={getSousTraitanceBadge(trajetSelectionne.type_sous_traitance).bg} className="ms-2">{getSousTraitanceBadge(trajetSelectionne.type_sous_traitance).text}</Badge></p>
                                {trajetSelectionne.transporteur_externe_details && <p><strong>Transporteur:</strong> {trajetSelectionne.transporteur_externe_details.nom}</p>}
                                <p><strong>État Paiement Frais:</strong><Badge bg={getPaiementBadge(trajetSelectionne.statut_paiement_frais)} className="ms-2">{trajetSelectionne.statut_paiement_frais === 'paye' ? 'Payé' : trajetSelectionne.statut_paiement_frais === 'partiel' ? 'Partiel' : 'Non Payé'}</Badge></p>
                            </Card.Body></Card></Col>
                            <Col md={6}><Card className="mb-3"><Card.Header><h6 className="mb-0">👥 Participants</h6></Card.Header><Card.Body>
                                <p><strong>Client:</strong> {trajetSelectionne.client_details?.nom || `Client ${trajetSelectionne.client}`}</p>
                                <p><strong>ICE Client:</strong> {trajetSelectionne.client_details?.ice || 'Non renseigné'}</p>
                                {trajetSelectionne.type_sous_traitance !== 'je_donne' && (
                                    <>
                                        <p><strong>Chauffeur:</strong> {trajetSelectionne.chauffeur_details ? `${trajetSelectionne.chauffeur_details.prenom} ${trajetSelectionne.chauffeur_details.nom}` : `Chauffeur ${trajetSelectionne.chauffeur}`}</p>
                                        <p><strong>Camion:</strong> {trajetSelectionne.camion_details ? `${trajetSelectionne.camion_details.immatriculation} - ${trajetSelectionne.camion_details.marque} ${trajetSelectionne.camion_details.modele}` : `Camion ${trajetSelectionne.camion}`}</p>
                                    </>
                                )}
                            </Card.Body></Card></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Card className="mb-3"><Card.Header><h6 className="mb-0">📦 Détails Livraison</h6></Card.Header><Card.Body>
                                <p><strong>Destination:</strong> {trajetSelectionne.destination_details?.ville || `Destination ${trajetSelectionne.destination}`}</p>
                                <p><strong>Nombre de Conteneurs:</strong> {trajetSelectionne.n_conteneurs}</p>
                                <p><strong>Numéros de Conteneurs:</strong> {trajetSelectionne.numeros_conteneurs || 'Non spécifié'}</p>
                                {trajetSelectionne.type_sous_traitance !== 'je_donne' && (
                                    <p><strong>Frais de Déplacement:</strong> {parseFloat(trajetSelectionne.frais_deplacement).toLocaleString()} DH</p>
                                )}
                            </Card.Body></Card></Col>
                            <Col md={6}><Card className="mb-3"><Card.Header><h6 className="mb-0">💰 Aspects Financiers</h6></Card.Header><Card.Body>
                                <p><strong>Prix du Trajet:</strong> {parseFloat(trajetSelectionne.prix_trajet).toLocaleString()} DH</p>
                                {trajetSelectionne.prix_sous_traitance > 0 && <p><strong>Prix Sous-traitance:</strong><span className={trajetSelectionne.type_sous_traitance === 'je_donne' ? 'text-danger' : 'text-success'}> {parseFloat(trajetSelectionne.prix_sous_traitance).toLocaleString()} DH{trajetSelectionne.type_sous_traitance === 'je_donne' ? ' (À payer)' : ' (À recevoir)'}</span></p>}
                                {trajetSelectionne.type_sous_traitance !== 'je_donne' && (
                                    <p><strong>Total Frais Supplémentaires:</strong> {parseFloat(trajetSelectionne.total_frais_supplementaires || 0).toLocaleString()} DH</p>
                                )}
                                <hr />
                                <h6 className="text-success">
                                    <strong>Total: {calculerTotalAffichage(trajetSelectionne).toLocaleString()} DH</strong>
                                </h6>
                            </Card.Body></Card></Col>
                        </Row>
                        {trajetSelectionne.frais_supplementaires_list && trajetSelectionne.frais_supplementaires_list.length > 0 && trajetSelectionne.type_sous_traitance !== 'je_donne' && (
                            <Card className="mb-3"><Card.Header><h6 className="mb-0">💸 Frais Supplémentaires</h6></Card.Header><Card.Body>
                                <Table size="sm" bordered>
                                    <thead><tr><th>Nom du Frais</th><th>Montant (DH)</th></tr></thead>
                                    <tbody>
                                        {trajetSelectionne.frais_supplementaires_list.map((frais, index) => <tr key={index}><td>{frais.nom}</td><td>{parseFloat(frais.montant).toLocaleString()} DH</td></tr>)}
                                    </tbody>
                                </Table>
                            </Card.Body></Card>
                        )}
                        {trajetSelectionne.remarques && <Card className="mb-3"><Card.Header><h6 className="mb-0">📝 Remarques</h6></Card.Header><Card.Body><p>{trajetSelectionne.remarques}</p></Card.Body></Card>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseDetails}>Fermer</Button>
                        <Button variant="primary" onClick={() => { handleCloseDetails(); handleShowForm(trajetSelectionne); }}>✏️ Modifier</Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
}

export default Trajets;