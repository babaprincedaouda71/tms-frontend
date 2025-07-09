import {useCallback, useState} from 'react';
import {BatchProgress, QuestionnaireGenerator} from "@/utils/plan/QuestionnaireGenerator";
import {GROUPE_EVALUATION_URLS, QUESTIONNAIRE_URLS} from "@/config/urls";

export const useQuestionnaireGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState<BatchProgress | null>(null);
    const [error, setError] = useState<string>('');

    const generateQuestionnaires = useCallback(async (
        selectedParticipants: any[],
        groupeEvaluationId: string,
        options: {
            trainingTheme: string;
            groupName: string;
            getBaseUrl: () => string;
        }
    ): Promise<Blob> => {
        setIsGenerating(true);
        setError('');
        setProgress(null);

        try {
            // Validation initiale
            if (!selectedParticipants.length) {
                throw new Error('Aucun participant sélectionné');
            }

            if (selectedParticipants.length > 50) {
                const confirm = window.confirm(
                    `Vous allez générer ${selectedParticipants.length} questionnaires. Cela peut prendre du temps. Continuer ?`
                );
                if (!confirm) {
                    throw new Error('Génération annulée par l\'utilisateur');
                }
            }

            // Fetch des données d'évaluation
            const evaluationData = await fetchEvaluationData(groupeEvaluationId);

            // Import dynamique de jsPDF
            const {jsPDF} = await import('jspdf');

            // Créer le générateur
            const generator = new QuestionnaireGenerator(jsPDF);

            // Générer le PDF avec suivi de progression
            const pdfBlob = await generator.generateBatch(
                selectedParticipants,
                evaluationData,
                {
                    ...options,
                    onProgress: setProgress
                }
            );

            setProgress({
                current: selectedParticipants.length,
                total: selectedParticipants.length,
                percentage: 100
            });

            return pdfBlob;

        } catch (error: any) {
            setError(error.message || 'Erreur lors de la génération');
            throw error;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const fetchEvaluationData = async (groupeEvaluationId: string) => {
        const responses = await Promise.all([
            fetch(`${GROUPE_EVALUATION_URLS.getEvaluationForF4}/${groupeEvaluationId}`, {
                credentials: 'include',
                headers: {'Content-Type': 'application/json'}
            }),
            fetch(`${GROUPE_EVALUATION_URLS.getTokensForF4}/${groupeEvaluationId}`, {
                credentials: 'include',
                headers: {'Content-Type': 'application/json'}
            })
        ]);

        // Vérifier les réponses
        for (const response of responses) {
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
            }
        }

        const [evaluation, tokens] = await Promise.all(
            responses.map(r => r.json())
        );

        // Vérifier le statut de l'évaluation
        if (evaluation.status !== 'Publiée') {
            throw new Error(`L'évaluation doit être publiée. Statut actuel: ${evaluation.status}`);
        }

        // Récupérer le questionnaire
        const questionnaireResponse = await fetch(`${QUESTIONNAIRE_URLS.getF4Questionnaire}/${evaluation.questionnaireId}`, {
            credentials: 'include',
            headers: {'Content-Type': 'application/json'}
        });

        if (!questionnaireResponse.ok) {
            throw new Error('Erreur lors de la récupération du questionnaire');
        }

        const questionnaire = await questionnaireResponse.json();

        return {
            id: evaluation.id,
            label: evaluation.label,
            status: evaluation.status,
            questionnaire,
            qrTokens: tokens
        };
    };

    return {
        generateQuestionnaires,
        isGenerating,
        progress,
        error,
        resetError: () => setError('')
    };
};