import Table from '@/components/Tables/Table1'
import React, {useMemo, useState} from 'react'
import {GroupeEvaluationDetailProps} from '@/types/dataTypes'
import ProgressBar from '@/components/ProgressBar'
import {handleSort} from '@/utils/sortUtils'
import EyeFileIcon from '@/components/Svgs/EyeFileIcon'
import PDFIcon from '@/components/Svgs/PDFIcon'
import useTable from '@/hooks/useTable'
import useSWR from "swr";
import {GROUPE_EVALUATION_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";
import QuestionnaireModal from "@/components/ui/QuestionnaireModal";

const RECORDS_PER_PAGE = 5;

interface DetailEvaluationProps {
    groupeEvaluationId: string | number | undefined;
    onBack?: () => void;
}

interface Participant {
    id: number;
    name: string;
}

const DetailEvaluation: React.FC<DetailEvaluationProps> = ({
                                                               groupeEvaluationId,
                                                               onBack
                                                           }) => {
    // État pour gérer les participants sélectionnés et le modal
    const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
    const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);

    // Récupération des détails de l'évaluation
    const {
        data: groupeEvaluationDetails,
        error,
        mutate,
        isLoading
    } = useSWR<GroupeEvaluationDetailProps[]>(
        groupeEvaluationId ? GROUPE_EVALUATION_URLS.getDetails + `/${groupeEvaluationId}` : null,
        fetcher
    );

    const memorizedData = useMemo(() => groupeEvaluationDetails || [], [groupeEvaluationDetails]);

    // Fonction pour gérer la sélection des participants
    const handleParticipantSelection = (participantId: number, isSelected: boolean) => {
        setSelectedParticipants(prev => {
            const newSelection = new Set(prev);
            if (isSelected) {
                newSelection.add(participantId);
            } else {
                newSelection.delete(participantId);
            }
            return newSelection;
        });
    };

    // Fonction pour sélectionner/désélectionner tous les participants
    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) {
            const allIds = memorizedData.map(item => item.id);
            setSelectedParticipants(new Set(allIds));
        } else {
            setSelectedParticipants(new Set());
        }
    };

    // Fonction pour ouvrir le modal de génération de questionnaires
    const handleDownloadQuestionnaires = () => {
        if (selectedParticipants.size === 0) {
            alert('Veuillez sélectionner au moins un participant');
            return;
        }

        // Vérification supplémentaire pour les gros volumes
        if (selectedParticipants.size > 20) {
            const confirm = window.confirm(
                `Vous allez générer ${selectedParticipants.size} questionnaires. ` +
                'Cela peut prendre plusieurs minutes. Voulez-vous continuer ?'
            );
            if (!confirm) return;
        }

        setIsQuestionnaireModalOpen(true);
    };

    const TABLE_HEADERS = [
        "Nom",
        "État d'avancement",
        "Actions",
        "Sélection"
    ];

    const TABLE_KEYS = [
        "name",
        "progress",
        "actions",
        "selection",
    ];

    const {
        visibleColumns,
        handleSortData,
        totalRecords,
        sortableColumns,
        paginatedData,
    } = useTable(memorizedData, TABLE_HEADERS, TABLE_KEYS, RECORDS_PER_PAGE);

    // Calcul des états de sélection
    const isAllSelected = selectedParticipants.size === memorizedData.length && memorizedData.length > 0;
    const isPartiallySelected = selectedParticipants.size > 0 && selectedParticipants.size < memorizedData.length;

    // Préparer les données des participants sélectionnés pour le modal
    const selectedParticipantsData: Participant[] = memorizedData
        .filter(item => selectedParticipants.has(item.id))
        .map(item => ({
            id: item.id,
            name: item.name
        }));

    // Renderers pour les en-têtes personnalisés
    const headerRenderers = {
        "Sélection": () => (
            <input
                type="checkbox"
                className="h-5 w-5 accent-primary cursor-pointer"
                checked={isAllSelected}
                ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Sélectionner tous les participants"
                title={isAllSelected ? 'Désélectionner tout' : 'Sélectionner tout'}
            />
        )
    };

    const renderers = {
        progress: (value: number) => (
            <div>
                <span>{value} %</span>
                <ProgressBar progress={value}/>
            </div>
        ),
        actions: (_: string, row: any) => (
            <div className="flex justify-around items-center">
                <EyeFileIcon
                    className='h-6 w-6 cursor-pointer hover:text-blue-600 transition-colors'
                />
                <PDFIcon
                    className='h-6 w-6 cursor-pointer hover:text-red-600 transition-colors'
                />
            </div>
        ),
        selection: (_: string, row: Participant) => (
            <input
                type="checkbox"
                className="h-5 w-5 accent-primary cursor-pointer"
                checked={selectedParticipants.has(row.id)}
                onChange={(e) => handleParticipantSelection(row.id, e.target.checked)}
                aria-label={`Sélectionner ${row.name}`}
                title={`Sélectionner ${row.name} pour génération groupée`}
            />
        ),
    };

    // Gestion des états de chargement et d'erreur
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <div className="text-gray-600">Chargement des détails de l'évaluation...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center p-8">
                <div className="text-red-600 mb-4 text-center">
                    <div className="text-lg font-semibold mb-2">Erreur de chargement</div>
                    <div>Impossible de charger les détails de l'évaluation</div>
                </div>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-primary hover:underline font-medium"
                    >
                        ← Retour à la liste
                    </button>
                )}
            </div>
        );
    }

    if (!groupeEvaluationId) {
        return (
            <div className="flex flex-col items-center p-8">
                <div className="text-gray-600 mb-4">Aucune évaluation sélectionnée</div>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-primary hover:underline font-medium"
                    >
                        ← Retour à la liste
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <div className='flex flex-col gap-4'>
                {/* Bouton de retour */}
                {onBack && (
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-primary hover:underline flex items-center gap-2 font-medium"
                        >
                            ← Retour à la liste
                        </button>
                    </div>
                )}

                {/* Titre avec l'ID de l'évaluation */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold">
                        Détails de l'évaluation
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Gérez les participants et générez les questionnaires d'évaluation
                    </p>
                </div>

                {/* Tableau des participants */}
                <Table
                    data={paginatedData}
                    keys={TABLE_KEYS}
                    headers={TABLE_HEADERS}
                    sortableCols={sortableColumns}
                    onSort={(column, order) => handleSortData(column, order, handleSort)}
                    isPagination={false}
                    totalRecords={totalRecords}
                    loading={isLoading}
                    onAdd={() => null}
                    visibleColumns={visibleColumns}
                    renderers={renderers}
                    headerRenderers={headerRenderers}
                />

                {/* Section : Bouton d'action principal */}
                <div className="text-right text-xs md:text-sm lg:text-base">
                    <button
                        type="button"
                        className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        onClick={handleDownloadQuestionnaires}
                        disabled={selectedParticipants.size === 0}
                    >
                        {selectedParticipants.size === 0
                            ? "Télécharger (sélectionnez des participants)"
                            : `Télécharger questionnaires (${selectedParticipants.size} participant${selectedParticipants.size > 1 ? 's' : ''})`
                        }
                    </button>
                </div>

                {/* Lien vers la fiche d'évaluation synthétique */}
                <div
                    className='flex items-center justify-start gap-4 hover:cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition-colors'
                    onClick={() => alert("Fonctionnalité à implémenter")}
                >
                    <span className='text-primary font-extrabold'>Générer la fiche d'évaluation synthétique</span>
                    <img src='/images/pdf.svg' className='h-8 w-8' alt="PDF"/>
                </div>
            </div>

            {/* Modal de génération de questionnaires optimisé */}
            <QuestionnaireModal
                isOpen={isQuestionnaireModalOpen}
                onClose={() => setIsQuestionnaireModalOpen(false)}
                groupeEvaluationId={groupeEvaluationId.toString()}
                selectedParticipants={selectedParticipantsData}
                trainingTheme="Formation" // À adapter selon vos données réelles
                groupName="Groupe" // À adapter selon vos données réelles
            />
        </>
    )
}

export default DetailEvaluation