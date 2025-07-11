import {useCallback, useState} from 'react';
import {GROUPE_EVALUATION_URLS} from '@/config/urls';

// Créer le fichier du hook dans: src/hooks/plans/useEvaluationSynthese.ts

export interface QuestionStats {
    questionId: string;
    questionText: string;
    questionType: string;
    totalResponses: number;
    optionPercentages: Record<string, number>;
}

export interface EvaluationSynthese {
    evaluationId: string;
    evaluationLabel: string;
    questionnaireTitle: string;
    questionnaireDescription: string;
    totalParticipants: number;
    totalResponses: number;
    completionPercentage: number;
    questionStats: QuestionStats[];
    generationDate: string;
}

export const useEvaluationSynthese = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [syntheseData, setSyntheseData] = useState<EvaluationSynthese | null>(null);

    const fetchSyntheseData = useCallback(async (groupeEvaluationId: string): Promise<EvaluationSynthese> => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${GROUPE_EVALUATION_URLS.synthese}/${groupeEvaluationId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            setSyntheseData(data);
            return data;

        } catch (error: any) {
            const errorMessage = error.message || 'Erreur lors de la récupération des statistiques';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generateSynthesePDF = useCallback(async (
        groupeEvaluationId: string,
        options: {
            onProgress?: (progress: { current: number; total: number; percentage: number }) => void;
        } = {}
    ): Promise<Blob> => {
        try {
            // 1. Récupérer les données de synthèse
            const syntheseData = await fetchSyntheseData(groupeEvaluationId);

            // 2. Import dynamique de jsPDF
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.jsPDF;

            // 3. Créer le PDF
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // 4. Générer le contenu du PDF
            await generateSynthesePDFContent(doc, syntheseData, options.onProgress);

            // 5. Retourner le blob
            return doc.output('blob');

        } catch (error: any) {
            console.error('Erreur lors de la génération du PDF de synthèse:', error);
            throw error;
        }
    }, [fetchSyntheseData]);

    const resetError = useCallback(() => {
        setError('');
    }, []);

    return {
        fetchSyntheseData,
        generateSynthesePDF,
        isLoading,
        error,
        syntheseData,
        resetError
    };
};

// Fonction pour générer le contenu du PDF
async function generateSynthesePDFContent(
    doc: any,
    syntheseData: EvaluationSynthese,
    onProgress?: (progress: { current: number; total: number; percentage: number }) => void
): Promise<void> {
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    let currentY = margin;

    // Configuration des polices
    doc.setFont('helvetica');

    // 1. En-tête
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Fiche d\'Évaluation Synthétique', margin, currentY);
    currentY += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(syntheseData.questionnaireTitle, margin, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.text(syntheseData.evaluationLabel, margin, currentY);
    currentY += 15;

    // 2. Informations générales
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Informations générales', margin, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const generalInfo = [
        `Participants: ${syntheseData.totalResponses}/${syntheseData.totalParticipants}`,
        `Taux de completion: ${syntheseData.completionPercentage.toFixed(1)}%`,
        `Date de génération: ${new Date(syntheseData.generationDate).toLocaleDateString('fr-FR')}`
    ];

    for (const info of generalInfo) {
        doc.text(info, margin + 5, currentY);
        currentY += 5;
    }

    currentY += 10;

    // 3. Questions et statistiques
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Résultats par question', margin, currentY);
    currentY += 10;

    for (let i = 0; i < syntheseData.questionStats.length; i++) {
        const questionStat = syntheseData.questionStats[i];

        // Progress callback
        if (onProgress) {
            onProgress({
                current: i + 1,
                total: syntheseData.questionStats.length,
                percentage: ((i + 1) / syntheseData.questionStats.length) * 100
            });
        }

        // Vérifier si on a assez d'espace, sinon nouvelle page
        const estimatedHeight = 25 + (Object.keys(questionStat.optionPercentages).length * 5);
        if (currentY + estimatedHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
        }

        // Question
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const questionTitle = `${i + 1}. ${questionStat.questionText}`;
        const questionLines = doc.splitTextToSize(questionTitle, pageWidth - 2 * margin);
        doc.text(questionLines, margin, currentY);
        currentY += questionLines.length * 5 + 3;

        // Réponses et pourcentages
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        for (const [option, percentage] of Object.entries(questionStat.optionPercentages)) {
            const optionText = `${option}: ${percentage.toFixed(1)}%`;
            doc.text(optionText, margin + 10, currentY);
            currentY += 5;
        }

        currentY += 8; // Espacement entre questions
    }

    // 4. Pied de page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const footerText = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    doc.text(footerText, margin, pageHeight - 10);
}