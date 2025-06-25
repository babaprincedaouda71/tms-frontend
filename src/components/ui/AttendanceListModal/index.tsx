import React, {useRef, useState} from 'react';
import {Download, FileText, Save, X} from 'lucide-react';

// Interface pour les données de la compagnie
interface CompanyData {
    id: number;
    corporateName: string;
    address?: string;
    // Ajoutez d'autres champs selon vos besoins
}

// Interface pour les participants
interface Participant {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    code: string;
    position: string;
    level: string;
    manager: string;
}

// Interface pour les données du groupe (mise à jour)
interface GroupData {
    id?: number;
    name: string; // Nouveau champ ajouté
    targetAudience: string;
    managerCount: number;
    employeeCount: number;
    workerCount: number;
    temporaryWorkerCount: number;
    userGroupIds: number[];
    dates?: string[];
    location: string;
    // Ajoutez d'autres champs selon vos besoins
}

// Interface pour les données de formation
interface TrainingData {
    theme: string;
    location: string;
    startDate: string;
    endDate?: string;
    // Ajoutez d'autres champs selon vos besoins
}

interface AttendanceListModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainingData: TrainingData | null;
    groupData: GroupData | null;
    participants: Participant[];
    selectedDate: string;
    listType: 'internal' | 'csf';
    companyData: CompanyData | null;
    ocfData?: { corporateName: string } | null;
    onSave?: (pdfBlob: Blob) => Promise<void>;
    onSaveAndDownload?: (pdfBlob: Blob) => Promise<void>;
}

const AttendanceListModal: React.FC<AttendanceListModalProps> = ({
                                                                     isOpen,
                                                                     onClose,
                                                                     trainingData,
                                                                     groupData,
                                                                     participants,
                                                                     selectedDate,
                                                                     listType,
                                                                     companyData,
                                                                     ocfData,
                                                                     onSave,
                                                                     onSaveAndDownload
                                                                 }) => {
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const pdfBlobRef = useRef<Blob | null>(null);

    // Calculer l'effectif total
    const totalEffectif = (groupData?.managerCount || 0) +
        (groupData?.employeeCount || 0) +
        (groupData?.workerCount || 0) +
        (groupData?.temporaryWorkerCount || 0);

    // Fonction pour générer le PDF avec jsPDF
    const generatePDF = async () => {
        setIsGenerating(true);

        try {
            // Import dynamique de jsPDF
            const {jsPDF} = await import('jspdf');

            // Créer une nouvelle instance de jsPDF en format A4
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Dimensions A4 en mm
            const pageWidth = 210;
            const pageHeight = 297;

            // Marges
            const margin = 20;

            // Configuration des polices
            doc.setFont('helvetica');

            // --- Titre principal ---
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const title = "LISTE DE PRESENCE PAR ACTION ET PAR GROUPE";
            const titleWidth = doc.getTextWidth(title);
            doc.text(title, (pageWidth - titleWidth) / 2, 30);

            // --- Informations générales ---
            let currentY = 50;
            doc.setFontSize(12);
            const labelX = margin;
            const valueX = margin + 55;

            const addInfoLine = (label: string, value: string | undefined) => {
                if (value) {
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${label} :`, labelX, currentY);
                    doc.setFont('helvetica', 'normal');
                    doc.text(value, valueX, currentY);
                    currentY += 8;
                }
            };

            addInfoLine('Entreprise', companyData?.corporateName);
            addInfoLine('Thème de l\'action', trainingData?.theme);
            if (selectedDate) {
                const formattedDate = new Date(selectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
                addInfoLine('Jours de réalisation', formattedDate);
            }
            addInfoLine('Groupe Module', groupData?.name);
            addInfoLine('Effectif', totalEffectif > 0 ? totalEffectif.toString() : undefined);
            addInfoLine('Organisme de formation', ocfData?.corporateName);

            currentY += 10;

            // --- Tableau des participants ---
            const tableStartY = currentY;
            const mainHeaders = ['Prénom', 'Nom', 'N° CIN', 'N°CNSS', 'C.S.P*', 'Emargement'];
            const cspSubHeaders = ['C', 'E', 'O'];
            const cspSubColWidth = 8;
            const colWidths = [
                35, 35, 25, 25, cspSubColWidth * 3, 25
            ];
            const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);

            const rowHeight = 10;
            const headerHeight = 12;

            // --- Dessin de l'en-tête du tableau ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setLineWidth(0.3);
            doc.setDrawColor(0, 0, 0);

            doc.rect(margin, tableStartY, totalTableWidth, headerHeight);

            let currentX = margin;
            mainHeaders.forEach((header, index) => {
                const colWidth = colWidths[index];

                if (index < mainHeaders.length - 1) {
                    doc.line(currentX + colWidth, tableStartY, currentX + colWidth, tableStartY + headerHeight);
                }

                if (header === 'C.S.P*') {
                    const headerMidpointY = tableStartY + headerHeight / 2;
                    doc.line(currentX, headerMidpointY, currentX + colWidth, headerMidpointY);

                    const textWidth = doc.getTextWidth(header);
                    doc.text(header, currentX + (colWidth - textWidth) / 2, tableStartY + (headerHeight / 4) + 2);

                    let subCurrentX = currentX;
                    cspSubHeaders.forEach((subHeader, subIndex) => {
                        if (subIndex < cspSubHeaders.length - 1) {
                            doc.line(subCurrentX + cspSubColWidth, headerMidpointY, subCurrentX + cspSubColWidth, tableStartY + headerHeight);
                        }
                        const subTextWidth = doc.getTextWidth(subHeader);
                        doc.text(subHeader, subCurrentX + (cspSubColWidth - subTextWidth) / 2, headerMidpointY + (headerHeight / 4) + 2);
                        subCurrentX += cspSubColWidth;
                    });
                } else {
                    const textWidth = doc.getTextWidth(header);
                    doc.text(header, currentX + (colWidth - textWidth) / 2, tableStartY + headerHeight / 2 + 2);
                }

                currentX += colWidth;
            });

            // --- Lignes des participants (logique mise à jour) ---
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);

            let rowY = tableStartY + headerHeight;
            const minRows = 10; // MODIFICATION ICI : Définit un minimum de 10 lignes
            const totalRows = Math.max(minRows, participants.length);

            for(let i = 0; i < totalRows; i++) {
                const participant = participants[i];

                doc.rect(margin, rowY, totalTableWidth, rowHeight);
                let currentCellX = margin;

                colWidths.forEach((colWidth, colIndex) => {
                    if (colIndex < colWidths.length -1) {
                        doc.line(currentCellX + colWidth, rowY, currentCellX + colWidth, rowY + rowHeight);
                    }

                    if (mainHeaders[colIndex] === 'C.S.P*') {
                        const cspStartX = currentCellX;
                        doc.line(cspStartX + cspSubColWidth, rowY, cspStartX + cspSubColWidth, rowY + rowHeight);
                        doc.line(cspStartX + cspSubColWidth * 2, rowY, cspStartX + cspSubColWidth * 2, rowY + rowHeight);
                    }

                    if(participant) {
                        const dataX = currentCellX + 2;
                        switch(mainHeaders[colIndex]) {
                            case 'Prénom':
                                doc.text(participant.name, dataX, rowY + rowHeight - 4);
                                break;
                            case 'Nom':
                                doc.text(participant.lastName, dataX, rowY + rowHeight - 4);
                                break;
                            case 'C.S.P*':
                                const level = participant.level?.toUpperCase().charAt(0);
                                const cspStartX = currentCellX;
                                if (level === 'C') {
                                    doc.text('X', cspStartX + (cspSubColWidth / 2) - 1, rowY + rowHeight - 4);
                                } else if (level === 'E') {
                                    doc.text('X', cspStartX + cspSubColWidth + (cspSubColWidth / 2) - 1, rowY + rowHeight - 4);
                                } else if (level === 'O') {
                                    doc.text('X', cspStartX + (cspSubColWidth * 2) + (cspSubColWidth / 2) - 1, rowY + rowHeight - 4);
                                }
                                break;
                        }
                    }
                    currentCellX += colWidth;
                });
                rowY += rowHeight;
            }

            // --- Note en bas du tableau ---
            rowY += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('(*) C.S.P : Catégorie Socio-Professionnelle', margin, rowY);
            doc.text('C : Cadre - E : Employé - O : Ouvrier', margin, rowY + 4);

            // --- Signatures en bas de page ---
            const signatureY = pageHeight - 40;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            doc.text('Cachet de l\'organisme de formation', margin, signatureY);
            doc.text('Et identité du signataire', margin, signatureY + 5);

            const rightTextX = pageWidth - margin - 80;
            doc.text('Cachet et signature du responsable', rightTextX, signatureY);
            doc.text('de formation de l\'entreprise', rightTextX, signatureY + 5);

            const pdfBlob = doc.output('blob');
            pdfBlobRef.current = pdfBlob;

            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);

        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Effet pour générer le PDF quand le modal s'ouvre
    React.useEffect(() => {
        if (isOpen && trainingData && groupData) {
            generatePDF();
        }

        // Cleanup de l'URL quand le modal se ferme
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [isOpen, trainingData, groupData, participants, selectedDate]);

    // Fonction pour enregistrer le PDF
    const handleSave = async () => {
        if (!pdfBlobRef.current || !onSave) return;

        setIsLoading(true);
        try {
            await onSave(pdfBlobRef.current);
            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour enregistrer et télécharger
    const handleSaveAndDownload = async () => {
        if (!pdfBlobRef.current || !onSaveAndDownload) return;

        setIsLoading(true);
        try {
            await onSaveAndDownload(pdfBlobRef.current);

            // Télécharger le fichier
            const url = URL.createObjectURL(pdfBlobRef.current);
            const a = document.createElement('a');
            a.href = url;
            const fileName = `liste_presence_${listType}_${groupData?.name || 'formation'}_${selectedDate}.pdf`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde et téléchargement:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600"/>
                        <h2 className="text-xl font-semibold">
                            Liste de présence {listType === 'internal' ? 'interne' : 'CSF'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-hidden">
                    {isGenerating ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Génération du PDF en cours...</p>
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0 rounded"
                            title="Aperçu du PDF"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Erreur lors de la génération du PDF</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Annuler
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isLoading || !pdfBlobRef.current}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4"/>
                        {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>

                    <button
                        onClick={handleSaveAndDownload}
                        disabled={isLoading || !pdfBlobRef.current}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4"/>
                        {isLoading ? 'Traitement...' : 'Enregistrer et Télécharger'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceListModal;