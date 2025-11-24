import React, { useState, useEffect } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Form, Row, Col, Card, Badge, Modal
} from 'react-bootstrap';
import { employeService, trajetService, destinationService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function FraisChauffeurs() {
    const [chauffeurs, setChauffeurs] = useState([]);
    const [trajets, setTrajets] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showRapportModal, setShowRapportModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [trajetSelectionne, setTrajetSelectionne] = useState(null);
    const [chauffeurRapport, setChauffeurRapport] = useState(null);

    // Obtenir le mois actuel par défaut (du 1er au dernier jour du mois)
    const getCurrentMonthRange = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Formater les dates en YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            date_debut: formatDate(firstDay),
            date_fin: formatDate(lastDay)
        };
    };

    // États pour les filtres
    const [filtres, setFiltres] = useState({
        chauffeur: '',
        statut_paiement: '',
        ...getCurrentMonthRange()
    });

    // États pour le rapport détaillé
    const [rapportDates, setRapportDates] = useState(getCurrentMonthRange());

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [employesRes, trajetsRes, destinationsRes] = await Promise.all([
                employeService.getAll(),
                trajetService.getAll(),
                destinationService.getAll()
            ]);

            // Filtrer seulement les chauffeurs
            const chauffeursData = employesRes.data.filter(emp =>
                emp.type_employe === 'chauffeur' && emp.statut === 'actif'
            );
            setChauffeurs(chauffeursData);

            // Trier les trajets par date décroissante
            const trajetsTries = trajetsRes.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTrajets(trajetsTries);

            setDestinations(destinationsRes.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des données');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFiltreChange = (e) => {
        const { name, value } = e.target;
        setFiltres(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const reinitialiserFiltres = () => {
        setFiltres({
            chauffeur: '',
            statut_paiement: '',
            ...getCurrentMonthRange()
        });
    };

    const handleShowModal = (trajet) => {
        setTrajetSelectionne(trajet);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setTrajetSelectionne(null);
    };

    const handleShowRapportModal = (chauffeur) => {
        setChauffeurRapport(chauffeur);
        setRapportDates(getCurrentMonthRange());
        setShowRapportModal(true);
    };

    const handleCloseRapportModal = () => {
        setShowRapportModal(false);
        setChauffeurRapport(null);
    };

    const handleShowBulkModal = (chauffeur) => {
        setChauffeurRapport(chauffeur);
        setShowBulkModal(true);
    };

    const handleCloseBulkModal = () => {
        setShowBulkModal(false);
        setChauffeurRapport(null);
    };

    const handleUpdateStatutPaiement = async (nouveauStatut) => {
        if (!trajetSelectionne) return;

        setSaving(true);
        try {
            await trajetService.update(trajetSelectionne.id, {
                ...trajetSelectionne,
                statut_paiement_frais: nouveauStatut
            });

            fetchAllData();
            handleCloseModal();
        } catch (error) {
            setError('Erreur lors de la mise à jour');
            console.error('Error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleBulkUpdateStatutPaiement = async (nouveauStatut) => {
        if (!chauffeurRapport) return;

        const confirmation = window.confirm(
            `Êtes-vous sûr de vouloir marquer TOUS les frais de ${chauffeurRapport.prenom} ${chauffeurRapport.nom} comme "${getStatutText(nouveauStatut)}" ?\n\nCette action est irréversible.`
        );

        if (!confirmation) return;

        setSaving(true);
        try {
            const trajetsChauffeur = getTrajetsFiltresPourChauffeur(chauffeurRapport.id);

            // Mettre à jour tous les trajets du chauffeur
            const updatePromises = trajetsChauffeur.map(trajet =>
                trajetService.update(trajet.id, {
                    ...trajet,
                    statut_paiement_frais: nouveauStatut
                })
            );

            await Promise.all(updatePromises);
            fetchAllData();
            handleCloseBulkModal();
        } catch (error) {
            setError('Erreur lors de la mise à jour en masse');
            console.error('Error:', error);
        } finally {
            setSaving(false);
        }
    };

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

    // Génération du PDF pour les frais des chauffeurs (RAPPORT DÉTAILLÉ)
    const genererRapportPDF = () => {
        if (!chauffeurRapport) return;

        const trajetsChauffeur = getTrajetsFiltresPourChauffeurAvecDates(
            chauffeurRapport.id,
            rapportDates.date_debut,
            rapportDates.date_fin
        );

        if (trajetsChauffeur.length === 0) {
            alert('Aucun trajet trouvé pour cette période');
            return;
        }

        const doc = new jsPDF();

        // Configuration des couleurs
        const primaryColor = [41, 128, 185];
        const darkColor = [52, 73, 94];

        // Fonction pour créer l'en-tête sur une page
        const createHeader = (startY) => {
            // En-tête avec logo
            try {
                const logoUrl = '/images/logos/ars_distribution.png';
                doc.addImage(logoUrl, 'PNG', 14, startY, 30, 30);
            } catch (error) {
                console.warn('Logo non chargé:', error);
            }

            // Titre principal
            doc.setFontSize(16);
            doc.setTextColor(...darkColor);
            doc.text('RAPPORT CHAUFFEURS - SUIVI DES FRAIS', 105, startY + 10, { align: 'center' });

            // Période
            doc.setFontSize(12);
            doc.text(`Période : ${rapportDates.date_debut} à ${rapportDates.date_fin}`, 105, startY + 20, { align: 'center' });

            // Informations chauffeur
            doc.setFontSize(14);
            doc.text(`Chauffeur : ${chauffeurRapport.prenom} ${chauffeurRapport.nom}`, 14, startY + 35);

            // Camion (si disponible)


            return startY + 50; // Retourne la position Y de départ après l'en-tête
        };

        // Fonction pour ajouter une nouvelle page avec en-tête
        const addNewPageWithHeader = () => {
            doc.addPage();
            return createHeader(10); // Commence à Y=10 sur la nouvelle page
        };

        // Créer l'en-tête sur la première page (sans addPage())
        let startY = createHeader(20); // Commence à Y=20 sur la première page

        // Tableau principal avec gestion des sauts de page
        const tableColumns = [
            "Date",
            "Client",
            "N° Conteneur",
            "Destination",
            "Frais chauffeur",
            "Autres frais",
            "ETAT"
        ];

        const tableRows = trajetsChauffeur.map(trajet => {
            const fraisChauffeur = parseFloat(trajet.frais_deplacement || 0);
            const autresFrais = parseFloat(trajet.total_frais_supplementaires || 0);

            return [
                trajet.date,
                trajet.client_details?.nom || 'N/A',
                trajet.numeros_conteneurs || '-',
                trajet.destination_details?.ville || 'N/A',
                `${fraisChauffeur.toLocaleString('fr-FR')} DH`,
                `${autresFrais.toLocaleString('fr-FR')} DH`,
                getStatutText(trajet.statut_paiement_frais)
            ];
        });

        // Configuration de autoTable avec gestion des sauts de page
        const tableConfig = {
            head: [tableColumns],
            body: tableRows,
            startY: startY,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 3,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                lineWidth: 0.1
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: startY },
            didDrawPage: function (data) {
                // Si on a une page suivante, on réaffiche l'en-tête
                if (data.pageNumber > 1) {
                    createHeader(10);
                }
            },
            willDrawCell: function (data) {
                // Vérifier si on dépasse la page et ajouter une nouvelle page si nécessaire
                if (data.cell.y > 250) {
                    // Cette logique est gérée automatiquement par autoTable
                }
            }
        };

        // Générer le tableau
        autoTable(doc, tableConfig);

        // Récupérer la position finale après le tableau
        startY = doc.lastAutoTable.finalY + 10;

        // Vérifier si on a assez d'espace pour les totaux, sinon nouvelle page
        if (startY > 200) {
            startY = addNewPageWithHeader();
        }

        // Calcul des totaux
        const totalTrajets = trajetsChauffeur.length;
        const totalFraisChauffeur = trajetsChauffeur.reduce((sum, t) => sum + parseFloat(t.frais_deplacement || 0), 0);
        const totalAutresFrais = trajetsChauffeur.reduce((sum, t) => sum + parseFloat(t.total_frais_supplementaires || 0), 0);
        const totalGeneral = totalFraisChauffeur + totalAutresFrais;

        // Affichage des totaux avec style amélioré
        doc.setFillColor(240, 240, 240);
        doc.rect(10, startY - 5, 190, 35, 'F');

        doc.setFontSize(10);
        doc.setTextColor(...darkColor);
        doc.setFont(undefined, 'bold');
        doc.text(`Nombre de transports : ${totalTrajets}`, 15, startY + 5);
        doc.text(`FRAIS CHAUFFEUR PAYÉS :`, 15, startY + 12);
        doc.text(`AUTRES FRAIS PAYÉS :`, 15, startY + 19);

        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(`${totalFraisChauffeur.toLocaleString('fr-FR')} DH`, 70, startY + 12);
        doc.text(`${totalAutresFrais.toLocaleString('fr-FR')} DH`, 65, startY + 19);

        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(46, 204, 113); // Vert
        doc.text(`TOTAL : ${totalGeneral.toLocaleString('fr-FR')} DH`, 15, startY + 27);

        startY += 45;

        // Vérifier l'espace pour la déclaration
        if (startY > 180) {
            startY = addNewPageWithHeader();
        }

        // Déclaration du chauffeur
        const declarationText = `Je soussigné, ${chauffeurRapport.prenom} ${chauffeurRapport.nom}, reconnais avoir reçu et encaissé la somme de ${totalGeneral.toLocaleString('fr-FR')} DH en règlement de tous mes frais afférents à mes missions de transport pour la période du ${rapportDates.date_debut} au ${rapportDates.date_fin}.`;

        const declarationLines = doc.splitTextToSize(declarationText, 180);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...darkColor);
        declarationLines.forEach((line, index) => {
            doc.text(line, 14, startY + (index * 4));
        });

        startY += (declarationLines.length * 4) + 15;

        // Vérifier l'espace pour les signatures
        if (startY > 220) {
            startY = addNewPageWithHeader();
        }

        // Signatures avec meilleur espacement
        doc.setFontSize(9);
        doc.setTextColor(...darkColor);

        // Signature chauffeur à gauche
        doc.text('Fait à :', 20, startY);
        doc.text('Le :', 20, startY + 6);
        doc.text('Signature du chauffeur :', 20, startY + 20);
        doc.setDrawColor(...darkColor);
        doc.setLineWidth(0.5);
        doc.line(20, startY + 22, 80, startY + 22);

        // Signature responsable à droite
        doc.text('Signature du responsable :', 120, startY + 20);
        doc.line(120, startY + 22, 180, startY + 22);

        // Pied de page avec informations entreprise
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('Bd Moulay Ismail Bloc 20 NO.57 Casablanca', 105, pageHeight - 15, { align: 'center' });
        doc.text('R C 518669 Patente 31302654 I F 50575265', 105, pageHeight - 10, { align: 'center' });

        // Numéro de page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i}/${pageCount}`, 105, pageHeight - 5, { align: 'center' });
        }

        // Sauvegarder le PDF
        const nomFichier = `RAPPORT CHAUFFEURS - SUIVI DES FRAIS ${chauffeurRapport.prenom} ${chauffeurRapport.nom}.pdf`;
        doc.save(nomFichier);
    };

    // Calculer les totaux par chauffeur
    const calculerTotauxParChauffeur = () => {
        const totaux = {};

        chauffeurs.forEach(chauffeur => {
            const trajetsChauffeur = trajets.filter(t =>
                t.chauffeur == chauffeur.id &&
                (!filtres.chauffeur || t.chauffeur == filtres.chauffeur) &&
                (!filtres.statut_paiement || t.statut_paiement_frais === filtres.statut_paiement) &&
                (!filtres.date_debut || t.date >= filtres.date_debut) &&
                (!filtres.date_fin || t.date <= filtres.date_fin)
            );

            const fraisDeplacement = trajetsChauffeur.reduce((sum, t) => sum + parseFloat(t.frais_deplacement || 0), 0);
            const fraisSupplementaires = trajetsChauffeur.reduce((sum, t) => sum + parseFloat(t.total_frais_supplementaires || 0), 0);
            const totalFrais = fraisDeplacement + fraisSupplementaires;

            const fraisPayes = trajetsChauffeur
                .filter(t => t.statut_paiement_frais === 'paye')
                .reduce((sum, t) => sum + parseFloat(t.frais_deplacement || 0) + parseFloat(t.total_frais_supplementaires || 0), 0);

            const fraisNonPayes = trajetsChauffeur
                .filter(t => t.statut_paiement_frais !== 'paye')
                .reduce((sum, t) => sum + parseFloat(t.frais_deplacement || 0) + parseFloat(t.total_frais_supplementaires || 0), 0);

            totaux[chauffeur.id] = {
                nom: `${chauffeur.prenom} ${chauffeur.nom}`,
                totalTrajets: trajetsChauffeur.length,
                fraisDeplacement,
                fraisSupplementaires,
                totalFrais,
                fraisPayes,
                fraisNonPayes
            };
        });

        return totaux;
    };

    // Obtenir les trajets filtrés pour un chauffeur (triés par date)
    const getTrajetsFiltresPourChauffeur = (chauffeurId) => {
        const trajetsFiltres = trajets.filter(t =>
            t.chauffeur == chauffeurId &&
            (!filtres.statut_paiement || t.statut_paiement_frais === filtres.statut_paiement) &&
            (!filtres.date_debut || t.date >= filtres.date_debut) &&
            (!filtres.date_fin || t.date <= filtres.date_fin)
        );

        // Trier par date décroissante
        return trajetsFiltres.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // Obtenir les trajets filtrés pour un chauffeur avec dates spécifiques
    const getTrajetsFiltresPourChauffeurAvecDates = (chauffeurId, dateDebut, dateFin) => {
        const trajetsFiltres = trajets.filter(t =>
            t.chauffeur == chauffeurId &&
            (!dateDebut || t.date >= dateDebut) &&
            (!dateFin || t.date <= dateFin)
        );

        // Trier par date décroissante
        return trajetsFiltres.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const getStatutBadge = (statut) => {
        const statuts = {
            'paye': 'success',
            'non_paye': 'danger',
            'partiel': 'warning'
        };
        return statuts[statut] || 'secondary';
    };

    const getStatutText = (statut) => {
        const statuts = {
            'paye': 'Payé',
            'non_paye': 'Non Payé',
            'partiel': 'Partiel'
        };
        return statuts[statut] || statut;
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

    const totauxParChauffeur = calculerTotauxParChauffeur();
    const chauffeursFiltres = filtres.chauffeur
        ? chauffeurs.filter(c => c.id == filtres.chauffeur)
        : chauffeurs;

    return (
        <Container fluid className="px-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>💰 Gestion des Frais des Chauffeurs</h1>
                <div>
                    <small className="text-muted me-3">
                        Période par défaut: {filtres.date_debut} à {filtres.date_fin}
                    </small>
                </div>
            </div>

            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            {/* Section Filtres */}
            <Card className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">🔍 Filtres</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Chauffeur</Form.Label>
                                <Form.Select
                                    name="chauffeur"
                                    value={filtres.chauffeur}
                                    onChange={handleFiltreChange}
                                >
                                    <option value="">Tous les chauffeurs</option>
                                    {chauffeurs.map(chauffeur => (
                                        <option key={chauffeur.id} value={chauffeur.id}>
                                            {chauffeur.prenom} {chauffeur.nom}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Statut Paiement</Form.Label>
                                <Form.Select
                                    name="statut_paiement"
                                    value={filtres.statut_paiement}
                                    onChange={handleFiltreChange}
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="paye">Payé</option>
                                    <option value="non_paye">Non Payé</option>
                                    <option value="partiel">Partiel</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date Début</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="date_debut"
                                    value={filtres.date_debut}
                                    onChange={handleFiltreChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date Fin</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="date_fin"
                                    value={filtres.date_fin}
                                    onChange={handleFiltreChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end gap-2">
                            <Button variant="outline-secondary" onClick={reinitialiserFiltres}>
                                🔄 Réinitialiser
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Tableau des chauffeurs avec totaux - CHAQUE CHAUFFEUR A SA PROPRE BARRE DE SCROLL */}
            {chauffeursFiltres.map(chauffeur => {
                const totaux = totauxParChauffeur[chauffeur.id] || {
                    nom: `${chauffeur.prenom} ${chauffeur.nom}`,
                    totalTrajets: 0,
                    fraisDeplacement: 0,
                    fraisSupplementaires: 0,
                    totalFrais: 0,
                    fraisPayes: 0,
                    fraisNonPayes: 0
                };

                const trajetsChauffeur = getTrajetsFiltresPourChauffeur(chauffeur.id);

                return (
                    <Card key={chauffeur.id} className="mb-4">
                        <Card.Header className="bg-light">
                            <Row className="align-items-center">
                                <Col md={4}>
                                    <h5 className="mb-0">👨‍✈️ {totaux.nom}</h5>
                                </Col>
                                <Col md={8} className="text-end">
                                    <Badge bg="primary" className="me-2">Trajets: {totaux.totalTrajets}</Badge>
                                    <Badge bg="success" className="me-2">Payé: {totaux.fraisPayes.toLocaleString()} DH</Badge>
                                    <Badge bg="danger" className="me-2">Non Payé: {totaux.fraisNonPayes.toLocaleString()} DH</Badge>

                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => handleShowBulkModal(chauffeur)}
                                    >
                                        📝 Modifier Tous
                                    </Button>

                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => handleShowRapportModal(chauffeur)}
                                    >
                                        📊 Situation
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {/* Totaux du chauffeur */}
                            <div className="p-3 border-bottom">
                                <Row>
                                    <Col md={3}>
                                        <Card className="text-center border-primary">
                                            <Card.Body className="py-2">
                                                <Card.Title className="mb-1" style={{ fontSize: '0.9rem' }}>Frais Déplacement</Card.Title>
                                                <h6 className="text-primary">{totaux.fraisDeplacement.toLocaleString()} DH</h6>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center border-warning">
                                            <Card.Body className="py-2">
                                                <Card.Title className="mb-1" style={{ fontSize: '0.9rem' }}>Frais Supplémentaires</Card.Title>
                                                <h6 className="text-warning">{totaux.fraisSupplementaires.toLocaleString()} DH</h6>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center border-success">
                                            <Card.Body className="py-2">
                                                <Card.Title className="mb-1" style={{ fontSize: '0.9rem' }}>Total Payé</Card.Title>
                                                <h6 className="text-success">{totaux.fraisPayes.toLocaleString()} DH</h6>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center border-danger">
                                            <Card.Body className="py-2">
                                                <Card.Title className="mb-1" style={{ fontSize: '0.9rem' }}>Total Non Payé</Card.Title>
                                                <h6 className="text-danger">{totaux.fraisNonPayes.toLocaleString()} DH</h6>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>

                            {/* Tableau des trajets du chauffeur avec SCROLL INDIVIDUEL */}
                            <div style={{
                                maxHeight: '300px', // Hauteur réduite pour forcer l'apparition de la scrollbar
                                overflowY: 'auto',
                                position: 'relative',
                                border: '1px solid #ddd' // Bordure légère pour voir les limites
                            }}>
                                <Table striped bordered hover responsive size="sm" className="mb-0" style={{ minWidth: '1200px' }}>
                                    <thead className="table-dark" style={{
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        backgroundColor: '#212529'
                                    }}>
                                        <tr>
                                            <th width="100">Date</th>
                                            <th width="150">Destination</th>
                                            <th width="150">Client</th>
                                            <th width="120">N° Conteneur</th>
                                            <th width="100">Frais Dépl.</th>
                                            <th width="100">Frais Supp.</th>
                                            <th width="100">Total Frais</th>
                                            <th width="100">Statut</th>
                                            <th width="120">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trajetsChauffeur.map(trajet => {
                                            const totalFraisTrajet = parseFloat(trajet.frais_deplacement || 0) + parseFloat(trajet.total_frais_supplementaires || 0);

                                            return (
                                                <tr key={trajet.id}>
                                                    <td>
                                                        <strong>{trajet.date}</strong>
                                                        {isToday(trajet.date) && <Badge bg="success" className="ms-1">Aujourd'hui</Badge>}
                                                        {isYesterday(trajet.date) && <Badge bg="info" className="ms-1">Hier</Badge>}
                                                    </td>
                                                    <td>{trajet.destination_details?.ville || 'N/A'}</td>
                                                    <td>{trajet.client_details?.nom || 'N/A'}</td>
                                                    <td>{trajet.numeros_conteneurs || '-'}</td>
                                                    <td>{parseFloat(trajet.frais_deplacement || 0).toLocaleString()} DH</td>
                                                    <td>
                                                        {parseFloat(trajet.total_frais_supplementaires || 0) > 0 ? (
                                                            <Badge bg="secondary">{parseFloat(trajet.total_frais_supplementaires || 0).toLocaleString()} DH</Badge>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <strong>{totalFraisTrajet.toLocaleString()} DH</strong>
                                                    </td>
                                                    <td>
                                                        <Badge bg={getStatutBadge(trajet.statut_paiement_frais)}>
                                                            {getStatutText(trajet.statut_paiement_frais)}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleShowModal(trajet)}
                                                        >
                                                            📝 Modifier
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>

                            {trajetsChauffeur.length === 0 && (
                                <div className="text-center text-muted py-4">
                                    <p>Aucun trajet trouvé pour ce chauffeur avec les filtres actuels</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                );
            })}

            {/* Modal pour modifier le statut de paiement d'un seul trajet */}
            {showModal && trajetSelectionne && (
                <Modal show={showModal} onHide={handleCloseModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>📝 Modifier Statut Paiement</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p><strong>Trajet du:</strong> {trajetSelectionne.date}</p>
                        <p><strong>Destination:</strong> {trajetSelectionne.destination_details?.ville || 'N/A'}</p>
                        <p><strong>Client:</strong> {trajetSelectionne.client_details?.nom || 'N/A'}</p>
                        <p><strong>N° Conteneur:</strong> {trajetSelectionne.numeros_conteneurs || '-'}</p>
                        <p><strong>Frais déplacement:</strong> {parseFloat(trajetSelectionne.frais_deplacement || 0).toLocaleString()} DH</p>
                        <p><strong>Frais supplémentaires:</strong> {parseFloat(trajetSelectionne.total_frais_supplementaires || 0).toLocaleString()} DH</p>
                        <p><strong>Total:</strong> {(parseFloat(trajetSelectionne.frais_deplacement || 0) + parseFloat(trajetSelectionne.total_frais_supplementaires || 0)).toLocaleString()} DH</p>

                        <hr />

                        <Form.Group>
                            <Form.Label><strong>Nouveau statut de paiement:</strong></Form.Label>
                            <div className="d-grid gap-2">
                                <Button
                                    variant={trajetSelectionne.statut_paiement_frais === 'paye' ? 'success' : 'outline-success'}
                                    onClick={() => handleUpdateStatutPaiement('paye')}
                                    disabled={saving}
                                >
                                    ✅ Marquer comme Payé
                                </Button>
                                <Button
                                    variant={trajetSelectionne.statut_paiement_frais === 'partiel' ? 'warning' : 'outline-warning'}
                                    onClick={() => handleUpdateStatutPaiement('partiel')}
                                    disabled={saving}
                                >
                                    ⚠️ Marquer comme Partiel
                                </Button>
                                <Button
                                    variant={trajetSelectionne.statut_paiement_frais === 'non_paye' ? 'danger' : 'outline-danger'}
                                    onClick={() => handleUpdateStatutPaiement('non_paye')}
                                    disabled={saving}
                                >
                                    ❌ Marquer comme Non Payé
                                </Button>
                            </div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Annuler
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}

            {/* Modal pour le rapport détaillé */}
            {showRapportModal && chauffeurRapport && (
                <Modal show={showRapportModal} onHide={handleCloseRapportModal} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>📊 Rapport Détail - {chauffeurRapport.prenom} {chauffeurRapport.nom}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Date Début</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={rapportDates.date_debut}
                                            onChange={(e) => setRapportDates(prev => ({
                                                ...prev,
                                                date_debut: e.target.value
                                            }))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Date Fin</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={rapportDates.date_fin}
                                            onChange={(e) => setRapportDates(prev => ({
                                                ...prev,
                                                date_fin: e.target.value
                                            }))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="text-center">
                                <Button
                                    variant="success"
                                    onClick={genererRapportPDF}
                                    size="lg"
                                >
                                    📄 Générer le Rapport PDF
                                </Button>
                            </div>

                            {/* Aperçu des données */}
                            <div className="mt-4">
                                <h6>Aperçu des données :</h6>
                                <Table striped bordered size="sm">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Client</th>
                                            <th>Destination</th>
                                            <th>Frais (DH)</th>
                                            <th>Autres Frais (DH)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getTrajetsFiltresPourChauffeurAvecDates(
                                            chauffeurRapport.id,
                                            rapportDates.date_debut,
                                            rapportDates.date_fin
                                        ).slice(0, 5).map((trajet, index) => (
                                            <tr key={index}>
                                                <td>{trajet.date}</td>
                                                <td>{trajet.client_details?.nom || 'N/A'}</td>
                                                <td>{trajet.destination_details?.ville || 'N/A'}</td>
                                                <td>{parseFloat(trajet.frais_deplacement || 0).toLocaleString()}</td>
                                                <td>{parseFloat(trajet.total_frais_supplementaires || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                <small className="text-muted">
                                    Affichage des 5 premiers trajets. Le PDF contiendra tous les trajets.
                                </small>
                            </div>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseRapportModal}>
                            Fermer
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}

            {/* Modal pour la modification en masse */}
            {showBulkModal && chauffeurRapport && (
                <Modal show={showBulkModal} onHide={handleCloseBulkModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>📝 Modifier Tous les Statuts - {chauffeurRapport.prenom} {chauffeurRapport.nom}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Alert variant="warning">
                            <strong>Attention!</strong> Cette action va modifier le statut de paiement de <strong>TOUS</strong> les frais de ce chauffeur.
                            <br />
                            <strong>Trajets concernés:</strong> {getTrajetsFiltresPourChauffeur(chauffeurRapport.id).length} trajet(s)
                        </Alert>

                        <Form.Group>
                            <Form.Label><strong>Nouveau statut pour tous les frais:</strong></Form.Label>
                            <div className="d-grid gap-2">
                                <Button
                                    variant="outline-success"
                                    onClick={() => handleBulkUpdateStatutPaiement('paye')}
                                    disabled={saving}
                                >
                                    ✅ Tout marquer comme Payé
                                </Button>
                                <Button
                                    variant="outline-warning"
                                    onClick={() => handleBulkUpdateStatutPaiement('partiel')}
                                    disabled={saving}
                                >
                                    ⚠️ Tout marquer comme Partiel
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    onClick={() => handleBulkUpdateStatutPaiement('non_paye')}
                                    disabled={saving}
                                >
                                    ❌ Tout marquer comme Non Payé
                                </Button>
                            </div>
                        </Form.Group>

                        {saving && (
                            <div className="text-center mt-3">
                                <Spinner animation="border" size="sm" className="me-2" />
                                Mise à jour en cours...
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseBulkModal}>
                            Annuler
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </Container>
    );
}

export default FraisChauffeurs;