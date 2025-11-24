import React, { useState, useEffect } from 'react';
import {
    Container, Table, Button, Spinner, Alert,
    Form, Row, Col, Card, Badge, Modal
} from 'react-bootstrap';
import { tvaService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function SituationTVA() {
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showDeclaration, setShowDeclaration] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [editingOperation, setEditingOperation] = useState(null);

    const [filtres, setFiltres] = useState({
        entreprise: 'arn_logistique',
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear()
    });

    const [formData, setFormData] = useState({
        entreprise: 'arn_logistique',
        type_operation: 'debit',
        date_operation: new Date().toISOString().split('T')[0],
        date_valeur: new Date().toISOString().split('T')[0],
        libelle: '',
        montant_ht: '',
        taux_tva: 20,
        montant_tva: '',
        montant_ttc: '',
        categorie: 'divers',
        reference: '',
        beneficiaire: '',
        statut_tva: 'deductible'
    });

    const [stats, setStats] = useState({
        tva_collectee: 0,
        tva_deductible: 0,
        tva_nette: 0,
        total_credits_ht: 0,
        total_debits_ht: 0,
        total_credits_ttc: 0,
        total_debits_ttc: 0,
        solde_net: 0
    });

    const entreprises = [
        { value: 'arn_logistique', label: 'ARN Logistique' },
        { value: 'ars_distribution', label: 'ARS Distribution' }
    ];

    const categories = [
        { value: 'vente_client', label: 'Vente Client' },
        { value: 'achat_fournisseur', label: 'Achat Fournisseur' },
        { value: 'carburant', label: 'Carburant' },
        { value: 'entretien_vehicule', label: 'Entretien Véhicule' },
        { value: 'reparation_vehicule', label: 'Réparation Véhicule' },
        { value: 'assurance_vehicule', label: 'Assurance Véhicule' },
        { value: 'vignette_vehicule', label: 'Vignette Véhicule' },
        { value: 'controle_technique', label: 'Contrôle Technique' },
        { value: 'salaires', label: 'Salaires et Charges Sociales' },
        { value: 'loyer_bureau', label: 'Loyer Bureau' },
        { value: 'charges_locatives', label: 'Charges Locatives' },
        { value: 'electricite_eau', label: 'Électricité et Eau' },
        { value: 'telecom_internet', label: 'Télécommunications et Internet' },
        { value: 'fournitures_bureau', label: 'Fournitures Bureau' },
        { value: 'materiel_informatique', label: 'Matériel Informatique' },
        { value: 'frais_bancaires', label: 'Frais Bancaires' },
        { value: 'honoraires_comptable', label: 'Honoraires Comptable' },
        { value: 'honoraires_avocat', label: 'Honoraires Avocat' },
        { value: 'publicite_marketing', label: 'Publicité et Marketing' },
        { value: 'voyage_deplacement', label: 'Voyage et Déplacement' },
        { value: 'formation', label: 'Formation' },
        { value: 'peage_autoroute', label: 'Péage Autoroute' },
        { value: 'stationnement', label: 'Stationnement' },
        { value: 'impot_taxe', label: 'Impôts et Taxes' },
        { value: 'taxe_professionnelle', label: 'Taxe Professionnelle' },
        { value: 'autres_charges', label: 'Autres Charges' },
        { value: 'divers', label: 'Divers' }
    ];

    const mois = [
        { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
        { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
        { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
        { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
    ];

    const annees = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        fetchOperations();
        fetchStats();
    }, [filtres]);

    const fetchOperations = async () => {
        setLoading(true);
        try {
            const response = await tvaService.getOperations(filtres);
            setOperations(response.data);
            setError('');
        } catch (error) {
            setError('Erreur lors du chargement des opérations');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await tvaService.getStats(filtres);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleShowForm = (operation = null) => {
        if (operation) {
            setEditingOperation(operation);
            setFormData({
                entreprise: operation.entreprise,
                type_operation: operation.type_operation,
                date_operation: operation.date_operation,
                date_valeur: operation.date_valeur,
                libelle: operation.libelle,
                montant_ht: operation.montant_ht,
                taux_tva: operation.taux_tva,
                montant_tva: operation.montant_tva,
                montant_ttc: operation.montant_ttc,
                categorie: operation.categorie,
                reference: operation.reference || '',
                beneficiaire: operation.beneficiaire || '',
                statut_tva: operation.statut_tva
            });
        } else {
            setEditingOperation(null);
            setFormData({
                entreprise: filtres.entreprise,
                type_operation: 'debit',
                date_operation: new Date().toISOString().split('T')[0],
                date_valeur: new Date().toISOString().split('T')[0],
                libelle: '',
                montant_ht: '',
                taux_tva: 20,
                montant_tva: '',
                montant_ttc: '',
                categorie: 'divers',
                reference: '',
                beneficiaire: '',
                statut_tva: 'deductible'
            });
        }
        setError('');
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingOperation(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            let montantHT = parseFloat(formData.montant_ht) || 0;
            let montantTVA = parseFloat(formData.montant_tva) || 0;
            let montantTTC = parseFloat(formData.montant_ttc) || 0;

            // CORRECTION : Si TVA neutre, forcer TVA à 0
            if (formData.statut_tva === 'neutre') {
                montantTVA = 0;
                montantTTC = montantHT; // TTC = HT quand pas de TVA
            } else if (montantHT > 0 && !montantTVA && !montantTTC) {
                // Calcul normal de TVA
                montantTVA = montantHT * (formData.taux_tva / 100);
                montantTTC = montantHT + montantTVA;
            }

            const submissionData = {
                ...formData,
                montant_ht: montantHT,
                montant_tva: montantTVA,
                montant_ttc: montantTTC
            };

            if (editingOperation) {
                await tvaService.updateOperation(editingOperation.id, submissionData);
            } else {
                await tvaService.createOperation(submissionData);
            }

            fetchOperations();
            fetchStats();
            handleCloseForm();
        } catch (error) {
            console.log('Error details:', error);
            if (error.response?.data) {
                const errors = error.response.data;
                let errorMessage = 'Erreur de validation: ';
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
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
            try {
                await tvaService.deleteOperation(id);
                fetchOperations();
                fetchStats();
            } catch (error) {
                setError('Erreur lors de la suppression');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFormData = {
            ...formData,
            [name]: value
        };

        // CORRECTION : Gestion spéciale pour TVA neutre
        if (name === 'statut_tva') {
            if (value === 'neutre') {
                // Si TVA neutre, forcer taux TVA à 0 et recalculer
                newFormData.taux_tva = 0;
                newFormData.montant_tva = 0;
                if (newFormData.montant_ht) {
                    newFormData.montant_ttc = parseFloat(newFormData.montant_ht).toFixed(2);
                }
            } else {
                // Si pas neutre, remettre taux TVA à 20% par défaut
                newFormData.taux_tva = 20;
            }
        }

        // Recalcul automatique de la TVA si HT ou taux TVA changent (sauf si TVA neutre)
        if ((name === 'montant_ht' || name === 'taux_tva') && newFormData.montant_ht && newFormData.statut_tva !== 'neutre') {
            const ht = name === 'montant_ht' ? parseFloat(value) || 0 : parseFloat(newFormData.montant_ht) || 0;
            const taux = name === 'taux_tva' ? parseFloat(value) || 20 : parseFloat(newFormData.taux_tva) || 20;

            if (ht > 0) {
                const tva = ht * (taux / 100);
                const ttc = ht + tva;

                newFormData.montant_tva = tva.toFixed(2);
                newFormData.montant_ttc = ttc.toFixed(2);
            }
        }

        setFormData(newFormData);
    };

    const handleFiltreChange = (e) => {
        const { name, value } = e.target;
        setFiltres(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const calculerDeclaration = async () => {
        try {
            await tvaService.calculerDeclaration(filtres);
            setShowDeclaration(true);
        } catch (error) {
            setError('Erreur lors du calcul de la déclaration');
        }
    };

    const genererPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Configuration des couleurs professionnelles
        const primaryColor = [41, 128, 185];    // Bleu professionnel
        const secondaryColor = [52, 73, 94];    // Gris foncé
        const successColor = [46, 204, 113];    // Vert
        const dangerColor = [231, 76, 60];      // Rouge
        const warningColor = [243, 156, 18];    // Orange
        const infoColor = [52, 152, 219];       // Bleu clair

        // Fonction pour formater les nombres sans espaces
        const formatNombre = (nombre) => {
            return parseFloat(nombre).toFixed(2).replace(/\s/g, '');
        };

        // Fonction pour diviser le texte en plusieurs lignes
        const diviserTexte = (texte, maxLargeur, taillePolice = 7) => {
            doc.setFontSize(taillePolice);
            const mots = texte.split(' ');
            const lignes = [];
            let ligneActuelle = '';

            mots.forEach(mot => {
                const testLigne = ligneActuelle ? ligneActuelle + ' ' + mot : mot;
                const largeur = doc.getTextWidth(testLigne);

                if (largeur < maxLargeur) {
                    ligneActuelle = testLigne;
                } else {
                    if (ligneActuelle) lignes.push(ligneActuelle);
                    ligneActuelle = mot;
                }
            });

            if (ligneActuelle) {
                lignes.push(ligneActuelle);
            }

            return lignes;
        };

        // Déterminer l'entreprise sélectionnée
        const entrepriseSelectionnee = entreprises.find(e => e.value === filtres.entreprise);

        // URLs des logos avec les bons chemins
        const logos = {
            'ars_distribution': '/images/logos/ars_distribution.png',
            'arn_logistique': '/images/logos/arn_logistique.png'
        };

        const genererPageAvecLogo = async (pageNum) => {
            doc.setPage(pageNum);

            try {
                // Charger le logo selon l'entreprise
                const logoUrl = logos[filtres.entreprise];
                const img = new Image();
                img.crossOrigin = 'Anonymous';

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = logoUrl;
                });

                // Ajouter le logo
                const logoWidth = 35;
                const logoHeight = 35;
                doc.addImage(img, 'PNG', 20, 15, logoWidth, logoHeight);

            } catch (error) {
                console.warn('Logo non chargé:', error);
                // Fallback avec texte
                doc.setFontSize(14);
                doc.setTextColor(...primaryColor);
                doc.setFont('helvetica', 'bold');
                doc.text(entrepriseSelectionnee?.label || 'ENTREPRISE', 20, 30);
            }

            // En-tête principal
            doc.setFontSize(18);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('SITUATION TVA', pageWidth / 2, 25, { align: 'center' });

            // Informations de période
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Période: ${mois.find(m => m.value === parseInt(filtres.mois))?.label} ${filtres.annee}`, pageWidth / 2, 32, { align: 'center' });
            doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 37, { align: 'center' });

            return 45; // Retourne la position Y de départ du contenu
        };

        const genererPiedDePage = (pageNum, totalPages) => {
            doc.setPage(pageNum);

            // Ligne de séparation discrète
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');

            // Informations selon l'entreprise
            if (filtres.entreprise === 'ars_distribution') {
                doc.text('ARS DISTRIBUTION - Bd Moulay Ismail Bloc 20 NO.57 Casablanca', pageWidth / 2, pageHeight - 18, { align: 'center' });
                doc.text('Tél: +212 522-000000 | E-mail: ars.distribution1@gmail.com', pageWidth / 2, pageHeight - 14, { align: 'center' });
                doc.text('R.C : 518669 - Patente : 31302654 - I.F : 50575265 - C.N.S.S : 4355737 - ICE : 002910748000077', pageWidth / 2, pageHeight - 10, { align: 'center' });
            } else {
                doc.text('ARN LOGISTIQUE - 228, bd Mohamed V 7ème étage Bureau 200 Casablanca', pageWidth / 2, pageHeight - 18, { align: 'center' });
                doc.text('Tél: +212 522-000000 | E-mail: adli.rachid@homail.fr', pageWidth / 2, pageHeight - 14, { align: 'center' });
                doc.text('R.C 253799 - Patente 32190745 - I.F : 40467063 - C.N.S.S. 9029390 - ICE 000062536000007', pageWidth / 2, pageHeight - 10, { align: 'center' });
            }

            // Numéro de page
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${pageNum}/${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        };


        const genererTableauOperations = (startY) => {
            let yPosition = startY;
            yPosition += 10;
            // Titre section
            doc.setFontSize(12);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('DÉTAIL DES OPÉRATIONS', 20, yPosition);
            yPosition += 8;

            // Configuration des colonnes avec largeurs ajustées
            const colonnes = [
                { header: 'Date', dataKey: 'date_operation', width: 18 },
                { header: 'Type', dataKey: 'type_operation', width: 16 },
                { header: 'Libellé', dataKey: 'libelle', width: 50 },
                { header: 'Catégorie', dataKey: 'categorie', width: 30 },
                { header: 'HT (DH)', dataKey: 'montant_ht', width: 22, align: 'right' },
                { header: 'TVA (DH)', dataKey: 'montant_tva', width: 22, align: 'right' },
                { header: 'TTC (DH)', dataKey: 'montant_ttc', width: 22, align: 'right' }
            ];

            // Vérifier que la largeur totale ne dépasse pas la page
            const largeurTotale = colonnes.reduce((sum, col) => sum + col.width, 0);
            const margeTableau = 14;

            if (largeurTotale > pageWidth - 2 * margeTableau) {
                // Ajuster automatiquement les largeurs si nécessaire
                const ratio = (pageWidth - 2 * margeTableau) / largeurTotale;
                colonnes.forEach(col => {
                    col.width *= ratio;
                });
            }

            // En-tête du tableau
            doc.setFillColor(...primaryColor);
            doc.rect(margeTableau, yPosition, pageWidth - 2 * margeTableau, 8, 'F');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');

            let xPosition = margeTableau + 2;
            colonnes.forEach(colonne => {
                if (colonne.align === 'right') {
                    doc.text(colonne.header, xPosition + colonne.width - 4, yPosition + 5.5, { align: 'right' });
                } else {
                    doc.text(colonne.header, xPosition, yPosition + 5.5);
                }
                xPosition += colonne.width;
            });

            yPosition += 10;

            // Lignes du tableau
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');

            operations.forEach((operation, index) => {
                // Calculer la hauteur nécessaire pour cette ligne
                let hauteurLigne = 8; // Hauteur de base

                // Vérifier la hauteur pour le libellé
                const libelleLignes = diviserTexte(operation.libelle, colonnes[2].width - 4);
                const hauteurLibelle = libelleLignes.length * 3;

                // Vérifier la hauteur pour la catégorie
                const categorieTexte = operation.categorie.replace(/_/g, ' ');
                const categorieLignes = diviserTexte(categorieTexte, colonnes[3].width - 4);
                const hauteurCategorie = categorieLignes.length * 3;

                // Prendre la plus grande hauteur
                hauteurLigne = Math.max(hauteurLigne, hauteurLibelle, hauteurCategorie);

                // Vérifier si on doit changer de page
                if (yPosition + hauteurLigne > pageHeight - 60) {
                    doc.addPage();
                    genererPiedDePage(doc.internal.getNumberOfPages(), 0);
                    yPosition = 45;

                    // Réafficher l'en-tête du tableau sur la nouvelle page
                    doc.setFillColor(...primaryColor);
                    doc.rect(margeTableau, yPosition, pageWidth - 2 * margeTableau, 8, 'F');
                    doc.setFontSize(8);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont('helvetica', 'bold');

                    xPosition = margeTableau + 2;
                    colonnes.forEach(colonne => {
                        if (colonne.align === 'right') {
                            doc.text(colonne.header, xPosition + colonne.width - 4, yPosition + 5.5, { align: 'right' });
                        } else {
                            doc.text(colonne.header, xPosition, yPosition + 5.5);
                        }
                        xPosition += colonne.width;
                    });
                    yPosition += 10;
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                }

                // Fond alterné pour les lignes
                if (index % 2 === 0) {
                    doc.setFillColor(248, 249, 250);
                    doc.rect(margeTableau, yPosition, pageWidth - 2 * margeTableau, hauteurLigne, 'F');
                }

                let currentY = yPosition;
                xPosition = margeTableau + 2;

                // Date (sur une seule ligne)
                doc.setTextColor(...secondaryColor);
                doc.text(operation.date_operation, xPosition, currentY + 3);
                xPosition += colonnes[0].width;

                // Type avec couleur discrète (sur une seule ligne)
                const typeColor = operation.type_operation === 'credit' ? successColor : dangerColor;
                doc.setTextColor(...typeColor);
                doc.setFont('helvetica', 'bold');
                doc.text(operation.type_operation === 'credit' ? 'CREDIT' : 'DEBIT', xPosition, currentY + 3);
                doc.setFont('helvetica', 'normal');
                xPosition += colonnes[1].width;

                // Libellé (avec saut de ligne automatique)
                doc.setTextColor(...secondaryColor);
                const libelleLignesFinal = diviserTexte(operation.libelle, colonnes[2].width - 4);
                libelleLignesFinal.forEach((ligne, ligneIndex) => {
                    doc.text(ligne, xPosition, currentY + 3 + (ligneIndex * 3));
                });
                xPosition += colonnes[2].width;

                // Catégorie (avec saut de ligne automatique)
                const categorieTexteFinal = operation.categorie.replace(/_/g, ' ');
                const categorieLignesFinal = diviserTexte(categorieTexteFinal, colonnes[3].width - 4);
                categorieLignesFinal.forEach((ligne, ligneIndex) => {
                    doc.text(ligne, xPosition, currentY + 3 + (ligneIndex * 3));
                });
                xPosition += colonnes[3].width;

                // Montants HT
                doc.setTextColor(...secondaryColor);
                doc.text(formatNombre(operation.montant_ht), xPosition + colonnes[4].width - 4, currentY + 3, { align: 'right' });
                xPosition += colonnes[4].width;

                // Montants TVA
                doc.text(formatNombre(operation.montant_tva), xPosition + colonnes[5].width - 4, currentY + 3, { align: 'right' });
                xPosition += colonnes[5].width;

                // Montants TTC avec couleur selon le type
                doc.setFont('helvetica', 'bold');
                const montantColor = operation.type_operation === 'credit' ? successColor : dangerColor;
                doc.setTextColor(...montantColor);
                doc.text(formatNombre(operation.montant_ttc), xPosition + colonnes[6].width - 4, currentY + 3, { align: 'right' });
                doc.setFont('helvetica', 'normal');

                // Ligne séparatrice discrète
                doc.setDrawColor(230, 230, 230);
                doc.setLineWidth(0.1);
                doc.line(margeTableau, yPosition + hauteurLigne, pageWidth - margeTableau, yPosition + hauteurLigne);

                yPosition += hauteurLigne + 1;
            });

            return yPosition + 15;
        };

        const genererTotauxFinanciers = (startY) => {
            let yPosition = startY;

            // Titre section
            doc.setFontSize(12);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAUX FINANCIERS', 20, yPosition);
            yPosition += 8;

            // Tableau des totaux - design professionnel simple
            const largeurColonne = (pageWidth - 40) / 2;

            // En-tête
            doc.setFillColor(248, 249, 250);
            doc.rect(20, yPosition, largeurColonne, 6, 'F');
            doc.rect(20 + largeurColonne, yPosition, largeurColonne, 6, 'F');

            doc.setFontSize(9);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('CRÉDITS', 20 + largeurColonne / 2, yPosition + 4, { align: 'center' });
            doc.text('DÉBITS', 20 + largeurColonne + largeurColonne / 2, yPosition + 4, { align: 'center' });

            yPosition += 8;

            // Ligne HT
            doc.setFontSize(8);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'normal');
            doc.text('Total HT:', 25, yPosition + 4);
            doc.text(formatNombre(stats.total_credits_ht) + ' DH', 20 + largeurColonne / 2, yPosition + 4, { align: 'center' });
            doc.text(formatNombre(stats.total_debits_ht) + ' DH', 20 + largeurColonne + largeurColonne / 2, yPosition + 4, { align: 'center' });

            yPosition += 6;

            // Ligne TTC
            doc.text('Total TTC:', 25, yPosition + 4);
            doc.text(formatNombre(stats.total_credits_ttc) + ' DH', 20 + largeurColonne / 2, yPosition + 4, { align: 'center' });
            doc.text(formatNombre(stats.total_debits_ttc) + ' DH', 20 + largeurColonne + largeurColonne / 2, yPosition + 4, { align: 'center' });

            yPosition += 10;

            // Solde Net - design professionnel
            const soldeColor = stats.solde_net >= 0 ? successColor : dangerColor;
            const soldeTexte = stats.solde_net >= 0 ? 'BÉNÉFICE NET' : 'PERTE NETTE';

            doc.setFillColor(...soldeColor);
            doc.rect(20, yPosition, pageWidth - 40, 8, 'F');

            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(soldeTexte, 25, yPosition + 5.5);
            doc.text(formatNombre(Math.abs(stats.solde_net)) + ' DH', pageWidth - 25, yPosition + 5.5, { align: 'right' });

            return yPosition + 15;
        };

        const genererResumeTVA = (startY) => {
            let yPosition = startY;

            // Titre section
            doc.setFontSize(12);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('CALCUL TVA', 20, yPosition);
            yPosition += 8;

            // Tableau TVA - design professionnel simple
            const largeurColonne = (pageWidth - 40) / 2;

            // En-tête
            doc.setFillColor(248, 249, 250);
            doc.rect(20, yPosition, largeurColonne, 6, 'F');
            doc.rect(20 + largeurColonne, yPosition, largeurColonne, 6, 'F');

            doc.setFontSize(9);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('TVA COLLECTÉE', 20 + largeurColonne / 2, yPosition + 4, { align: 'center' });
            doc.text('TVA DÉDUCTIBLE', 20 + largeurColonne + largeurColonne / 2, yPosition + 4, { align: 'center' });

            yPosition += 8;

            // Montants TVA
            doc.setFontSize(9);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'normal');
            doc.text(formatNombre(stats.tva_collectee) + ' DH', 20 + largeurColonne / 2, yPosition + 4, { align: 'center' });
            doc.text(formatNombre(stats.tva_deductible) + ' DH', 20 + largeurColonne + largeurColonne / 2, yPosition + 4, { align: 'center' });

            yPosition += 10;

            // TVA Nette - design professionnel
            const tvaNetteColor = stats.tva_nette >= 0 ? successColor : dangerColor;
            const tvaNetteTexte = stats.tva_nette >= 0 ? 'TVA NETTE À PAYER' : 'CRÉDIT DE TVA';

            doc.setFillColor(...tvaNetteColor);
            doc.rect(20, yPosition, pageWidth - 40, 8, 'F');

            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(tvaNetteTexte, 25, yPosition + 5.5);
            doc.text(formatNombre(Math.abs(stats.tva_nette)) + ' DH', pageWidth - 25, yPosition + 5.5, { align: 'right' });

            return yPosition + 15;
        };

        // Génération du PDF
        const genererPDFComplet = async () => {
            try {
                // Page 1
                let yPosition = await genererPageAvecLogo(1);

                // 1. Tableau des opérations (PREMIER comme demandé)
                yPosition = genererTableauOperations(yPosition);

                // 2. Totaux financiers (DEUXIÈME)
                yPosition = genererTotauxFinanciers(yPosition + 10);

                // 3. Résumé TVA (TROISIÈME et DERNIER)
                yPosition = genererResumeTVA(yPosition + 10);

                // Ajouter les pieds de page sur toutes les pages
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    genererPiedDePage(i, totalPages);
                }

                // Sauvegarder le PDF
                doc.save(`situation-tva-${filtres.entreprise}-${filtres.mois}-${filtres.annee}.pdf`);

            } catch (error) {
                console.error('Erreur lors de la génération du PDF:', error);
                // Fallback simple sans logo
                const docFallback = new jsPDF();
                docFallback.setFontSize(16);
                docFallback.text('SITUATION TVA', 20, 20);
                docFallback.setFontSize(10);
                docFallback.text(`Entreprise: ${entrepriseSelectionnee?.label}`, 20, 30);
                docFallback.text(`Période: ${mois.find(m => m.value === parseInt(filtres.mois))?.label} ${filtres.annee}`, 20, 35);
                docFallback.save(`situation-tva-${filtres.entreprise}-${filtres.mois}-${filtres.annee}.pdf`);
            }
        };

        // Lancer la génération
        genererPDFComplet();
    };

    const getTypeBadge = (type) => type === 'credit' ? 'success' : 'danger';
    const getTypeLabel = (type) => type === 'credit' ? 'CREDIT (Entrée)' : 'DEBIT (Sortie)';

    const getStatutTVABadge = (statut) => {
        const statuts = { 'collectee': 'warning', 'deductible': 'info', 'neutre': 'secondary' };
        return statuts[statut] || 'secondary';
    };

    const getCategorieBadge = (categorie) => {
        const categories = {
            'vente_client': 'primary', 'carburant': 'success', 'entretien_vehicule': 'warning',
            'reparation_vehicule': 'danger', 'salaires': 'secondary', 'peage_autoroute': 'info',
            'loyer_bureau': 'dark', 'fournitures_bureau': 'light', 'honoraires_comptable': 'primary',
            'publicite_marketing': 'info', 'voyage_deplacement': 'warning'
        };
        return categories[categorie] || 'dark';
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
        <Container fluid className="px-3 px-md-4 py-4" style={{ minWidth: '320px' }}>
            {/* En-tête */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                <div>
                    <h1 className="h3 mb-1">🧾 Situation TVA</h1>
                    <p className="text-muted mb-0">
                        {entreprises.find(e => e.value === filtres.entreprise)?.label} -
                        {mois.find(m => m.value === parseInt(filtres.mois))?.label} {filtres.annee}
                    </p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => setShowStats(true)}>
                        📊 Stats
                    </Button>
                    <Button variant="outline-success" size="sm" onClick={genererPDF}>
                        📄 PDF
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleShowForm()}>
                        + Opération
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {/* Filtres */}
            <Card className="mb-4">
                <Card.Header className="bg-light">
                    <h6 className="mb-0">🔍 Filtres</h6>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3">
                        <Col xs={12} md={4}>
                            <Form.Label className="fw-medium">Entreprise</Form.Label>
                            <Form.Select
                                name="entreprise"
                                value={filtres.entreprise}
                                onChange={handleFiltreChange}
                                size="sm"
                            >
                                {entreprises.map(entreprise => (
                                    <option key={entreprise.value} value={entreprise.value}>
                                        {entreprise.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={6} md={3}>
                            <Form.Label className="fw-medium">Mois</Form.Label>
                            <Form.Select
                                name="mois"
                                value={filtres.mois}
                                onChange={handleFiltreChange}
                                size="sm"
                            >
                                {mois.map(mois => (
                                    <option key={mois.value} value={mois.value}>
                                        {mois.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={6} md={3}>
                            <Form.Label className="fw-medium">Année</Form.Label>
                            <Form.Select
                                name="annee"
                                value={filtres.annee}
                                onChange={handleFiltreChange}
                                size="sm"
                            >
                                {annees.map(annee => (
                                    <option key={annee} value={annee}>
                                        {annee}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12} md={2} className="d-flex align-items-end">
                            <Button
                                variant="success"
                                onClick={calculerDeclaration}
                                className="w-100"
                                size="sm"
                            >
                                🧮 Calculer
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Cartes de statistiques */}
            <Row className="g-3 mb-4">
                {[
                    { title: '💰 TVA Collectée', value: stats.tva_collectee, color: 'warning' },
                    { title: '📉 TVA Déductible', value: stats.tva_deductible, color: 'info' },
                    { title: '⚖️ TVA Nette', value: stats.tva_nette, color: stats.tva_nette >= 0 ? 'success' : 'danger' },
                    { title: '📈 Total Crédits', value: stats.total_credits_ttc, color: 'primary' },
                    { title: '📉 Total Débits', value: stats.total_debits_ttc, color: 'secondary' },
                    { title: '🏦 Solde Net', value: stats.solde_net, color: 'success' }
                ].map((stat, index) => (
                    <Col xs={6} md={4} lg={2} key={index}>
                        <Card className="h-100 text-center border-0 shadow-sm">
                            <Card.Body className="p-3">
                                <div className={`text-${stat.color} mb-1`}>
                                    <small className="fw-medium">{stat.title}</small>
                                </div>
                                <h6 className={`mb-0 text-${stat.color}`}>
                                    {stat.value.toLocaleString()} DH
                                </h6>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Tableau des opérations */}
            <Card>
                <Card.Header className="bg-white d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center py-3">
                    <div className="d-flex align-items-center mb-2 mb-md-0">
                        <h6 className="mb-0 me-2">📋 Opérations</h6>
                        <Badge bg="primary" className="fs-7">{operations.length}</Badge>
                    </div>
                    <small className="text-muted">
                        Double-cliquez pour modifier
                    </small>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: '60vh', overflowX: 'auto' }}>
                        <Table striped hover className="mb-0" style={{ minWidth: '800px' }}>
                            <thead className="table-light position-sticky top-0">
                                <tr>
                                    <th width="90" className="border-0">Date</th>
                                    <th width="100" className="border-0">Type</th>
                                    <th className="border-0">Libellé</th>
                                    <th width="120" className="border-0">Catégorie</th>
                                    <th width="100" className="border-0 text-end">HT (DH)</th>
                                    <th width="100" className="border-0 text-end">TVA (DH)</th>
                                    <th width="100" className="border-0 text-end">TTC (DH)</th>
                                    <th width="80" className="border-0 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operations.map((operation) => (
                                    <tr
                                        key={operation.id}
                                        onDoubleClick={() => handleShowForm(operation)}
                                        style={{ cursor: 'pointer' }}
                                        className="align-middle"
                                    >
                                        <td>
                                            <small className="fw-medium">{operation.date_operation}</small>
                                        </td>
                                        <td>
                                            <Badge bg={getTypeBadge(operation.type_operation)} className="fs-7">
                                                {getTypeLabel(operation.type_operation)}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div>
                                                <div className="fw-medium" style={{ fontSize: '0.9rem' }}>
                                                    {operation.libelle}
                                                </div>
                                                {operation.reference && (
                                                    <small className="text-muted">
                                                        Ref: {operation.reference}
                                                    </small>
                                                )}
                                                {operation.beneficiaire && (
                                                    <small className="text-muted d-block">
                                                        Bénéf: {operation.beneficiaire}
                                                    </small>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg={getCategorieBadge(operation.categorie)} className="fs-7">
                                                {operation.categorie.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="text-end">
                                            <span className="fw-medium">
                                                {parseFloat(operation.montant_ht).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            <Badge bg="secondary" className="fs-7">
                                                {parseFloat(operation.montant_tva).toLocaleString()}
                                            </Badge>
                                        </td>
                                        <td className="text-end">
                                            <span className={
                                                operation.type_operation === 'credit' ? 'text-success fw-bold' : 'text-danger fw-bold'
                                            }>
                                                {parseFloat(operation.montant_ttc).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="btn-group btn-group-sm" role="group">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleShowForm(operation)}
                                                    className="px-2"
                                                >
                                                    ✏️
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(operation.id)}
                                                    className="px-2"
                                                >
                                                    🗑️
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {operations.length === 0 && (
                        <div className="text-center text-muted py-5">
                            <div className="mb-3">📊</div>
                            <h6>Aucune opération trouvée</h6>
                            <p className="mb-3">Ajoutez votre première opération pour commencer</p>
                            <Button variant="primary" onClick={() => handleShowForm()}>
                                + Ajouter une opération
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Ajout/Modification d'opération */}
            <Modal show={showForm} onHide={handleCloseForm} size="lg" centered scrollable>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fs-6">
                        {editingOperation ? '✏️ Modifier l\'Opération' : '➕ Nouvelle Opération'}
                    </Modal.Title>
                </Modal.Header>
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <Form onSubmit={handleSubmit}>
                        <Modal.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Entreprise *</Form.Label>
                                        <Form.Select
                                            name="entreprise"
                                            value={formData.entreprise}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                            size="sm"
                                        >
                                            {entreprises.map(entreprise => (
                                                <option key={entreprise.value} value={entreprise.value}>
                                                    {entreprise.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Type *</Form.Label>
                                        <Form.Select
                                            name="type_operation"
                                            value={formData.type_operation}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                            size="sm"
                                        >
                                            <option value="debit">Débit (Sortie)</option>
                                            <option value="credit">Crédit (Entrée)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Date Opération *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="date_operation"
                                            value={formData.date_operation}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                            size="sm"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Date Valeur *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="date_valeur"
                                            value={formData.date_valeur}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                            size="sm"
                                        />
                                    </Form.Group>
                                </Col>

                                <Col xs={12}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Libellé *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="libelle"
                                            value={formData.libelle}
                                            onChange={handleChange}
                                            required
                                            placeholder="Description de l'opération..."
                                            disabled={saving}
                                            size="sm"
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Catégorie *</Form.Label>
                                        <Form.Select
                                            name="categorie"
                                            value={formData.categorie}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                            size="sm"
                                        >
                                            {categories.map(categorie => (
                                                <option key={categorie.value} value={categorie.value}>
                                                    {categorie.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Statut TVA *</Form.Label>
                                        <Form.Select
                                            name="statut_tva"
                                            value={formData.statut_tva}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                            size="sm"
                                        >
                                            <option value="collectee">TVA Collectée</option>
                                            <option value="deductible">TVA Déductible</option>
                                            <option value="neutre">Neutre (Sans TVA)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Référence</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="reference"
                                            value={formData.reference}
                                            onChange={handleChange}
                                            placeholder="N° référence..."
                                            disabled={saving}
                                            size="sm"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Bénéficiaire</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="beneficiaire"
                                            value={formData.beneficiaire}
                                            onChange={handleChange}
                                            placeholder="Nom du bénéficiaire..."
                                            disabled={saving}
                                            size="sm"
                                        />
                                    </Form.Group>
                                </Col>

                                <Col xs={12} md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Montant HT (DH) *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="montant_ht"
                                            value={formData.montant_ht}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            disabled={saving}
                                            size="sm"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Taux TVA (%) *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="taux_tva"
                                            value={formData.taux_tva}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            placeholder="20.00"
                                            disabled={saving || formData.statut_tva === 'neutre'}
                                            size="sm"
                                        />
                                        {formData.statut_tva === 'neutre' && (
                                            <Form.Text className="text-muted">
                                                Taux TVA forcé à 0% pour les opérations neutres
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium">Montant TTC (DH)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="montant_ttc"
                                            value={formData.montant_ttc}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="Calcul auto"
                                            disabled={saving}
                                            size="sm"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer className="bg-light">
                            <Button variant="outline-secondary" onClick={handleCloseForm} disabled={saving} size="sm">
                                Annuler
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving} size="sm">
                                {saving ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    editingOperation ? '💾 Modifier' : '💾 Ajouter'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </div>
            </Modal>

            {/* Modal Statistiques détaillées */}
            <Modal show={showStats} onHide={() => setShowStats(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>📊 Statistiques Détaillées</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Card className="border-0 bg-light">
                                <Card.Header className="bg-white">
                                    <h6 className="mb-0">📈 TVA</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Table borderless size="sm">
                                        <tbody>
                                            <tr>
                                                <td><strong>TVA Collectée</strong></td>
                                                <td className="text-end text-warning">{stats.tva_collectee.toLocaleString()} DH</td>
                                            </tr>
                                            <tr>
                                                <td><strong>TVA Déductible</strong></td>
                                                <td className="text-end text-info">{stats.tva_deductible.toLocaleString()} DH</td>
                                            </tr>
                                            <tr className="table-success">
                                                <td><strong>TVA Nette à Payer</strong></td>
                                                <td className="text-end text-success fw-bold">{stats.tva_nette.toLocaleString()} DH</td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="border-0 bg-light">
                                <Card.Header className="bg-white">
                                    <h6 className="mb-0">💳 Totaux</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Table borderless size="sm">
                                        <tbody>
                                            <tr>
                                                <td><strong>Total Crédits HT</strong></td>
                                                <td className="text-end">{stats.total_credits_ht.toLocaleString()} DH</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Total Débits HT</strong></td>
                                                <td className="text-end">{stats.total_debits_ht.toLocaleString()} DH</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Total Crédits TTC</strong></td>
                                                <td className="text-end text-success">{stats.total_credits_ttc.toLocaleString()} DH</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Total Débits TTC</strong></td>
                                                <td className="text-end text-danger">{stats.total_debits_ttc.toLocaleString()} DH</td>
                                            </tr>
                                            <tr className="table-primary">
                                                <td><strong>Solde Net</strong></td>
                                                <td className="text-end text-primary fw-bold">{stats.solde_net.toLocaleString()} DH</td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-primary" onClick={genererPDF} size="sm">
                        📄 Générer PDF
                    </Button>
                    <Button variant="secondary" onClick={() => setShowStats(false)} size="sm">
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Déclaration TVA */}
            <Modal show={showDeclaration} onHide={() => setShowDeclaration(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-warning bg-opacity-10">
                    <Modal.Title>📋 Déclaration TVA</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Card className="mb-3 border-warning">
                        <Card.Header className="bg-warning bg-opacity-10">
                            <h6 className="mb-0">
                                {entreprises.find(e => e.value === filtres.entreprise)?.label} -
                                {mois.find(m => m.value === parseInt(filtres.mois))?.label} {filtres.annee}
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <div className="bg-light p-3 rounded">
                                        <h6 className="text-center mb-3">📊 Récapitulatif TVA</h6>
                                        <Table borderless size="sm" className="mb-0">
                                            <tbody>
                                                <tr>
                                                    <td><strong>TVA Collectée</strong></td>
                                                    <td className="text-end text-warning">{stats.tva_collectee.toLocaleString()} DH</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>TVA Déductible</strong></td>
                                                    <td className="text-end text-info">{stats.tva_deductible.toLocaleString()} DH</td>
                                                </tr>
                                                <tr className="border-top">
                                                    <td><strong>TVA Nette à Payer</strong></td>
                                                    <td className="text-end text-success fw-bold fs-6">{stats.tva_nette.toLocaleString()} DH</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="bg-light p-3 rounded">
                                        <h6 className="text-center mb-3">💳 Flux Financiers</h6>
                                        <Table borderless size="sm" className="mb-0">
                                            <tbody>
                                                <tr>
                                                    <td><strong>Total Crédits TTC</strong></td>
                                                    <td className="text-end">{stats.total_credits_ttc.toLocaleString()} DH</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Total Débits TTC</strong></td>
                                                    <td className="text-end">{stats.total_debits_ttc.toLocaleString()} DH</td>
                                                </tr>
                                                <tr className="border-top">
                                                    <td><strong>Solde Net</strong></td>
                                                    <td className="text-end text-primary fw-bold">{stats.solde_net.toLocaleString()} DH</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Alert variant="info" className="mb-0">
                        <div className="d-flex align-items-center">
                            <div className="me-3">📅</div>
                            <div>
                                <strong>À déclarer avant le 20 du mois prochain</strong>
                                <br />
                                Montant à payer à l'État : <strong className="fs-5">{stats.tva_nette.toLocaleString()} DH</strong>
                            </div>
                        </div>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowDeclaration(false)} size="sm">
                        Fermer
                    </Button>
                    <Button variant="success" onClick={genererPDF} size="sm">
                        📄 Générer Déclaration PDF
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default SituationTVA;