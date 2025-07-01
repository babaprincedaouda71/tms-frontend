import Table from '@/components/Tables/Table1'
import React, {useMemo} from 'react'
import {GroupeEvaluationDetailProps} from '@/types/dataTypes'
import ProgressBar from '@/components/ProgressBar'
import {handleSort} from '@/utils/sortUtils'
import EyeFileIcon from '@/components/Svgs/EyeFileIcon'
import PDFIcon from '@/components/Svgs/PDFIcon'
import useTable from '@/hooks/useTable'
import useSWR from "swr";
import {GROUPE_EVALUATION_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";

const TABLE_HEADERS = [
    "Nom",
    "État d'avancement",
    "Actions",
];
const TABLE_KEYS = [
    "name",
    "progress",
    "actions",
];

const RECORDS_PER_PAGE = 5;

interface DetailEvaluationProps {
    groupeEvaluationId: string | number | undefined;
    onBack?: () => void;
}

const DetailEvaluation: React.FC<DetailEvaluationProps> = ({
                                                               groupeEvaluationId,
                                                               onBack
                                                           }) => {
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

    const {
        visibleColumns,
        handleSortData,
        totalRecords,
        sortableColumns,
        paginatedData,
    } = useTable(memorizedData, TABLE_HEADERS, TABLE_KEYS, RECORDS_PER_PAGE);

    const renderers = {
        progress: (value: number) => (
            <div>
                <span>{value} %</span>
                <ProgressBar progress={value}/>
            </div>
        ),
        actions: (_: string, row: any) => (
            <div className="flex justify-around items-center">
                <EyeFileIcon className='h-6 w-6'/>
                <PDFIcon className='h-6 w-6'/>
                <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    onClick={() => console.log("Élément coché :", row)}
                    aria-label={`Sélectionner ${row}`}
                />
            </div>
        )
    };

    // Gestion des états de chargement et d'erreur
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-gray-600">Chargement des détails de l'évaluation...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center p-8">
                <div className="text-redShade-600 mb-4">
                    Erreur lors du chargement des détails de l'évaluation
                </div>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-primary hover:underline"
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
                        className="text-primary hover:underline"
                    >
                        ← Retour à la liste
                    </button>
                )}
            </div>
        );
    }

    return (
        <form className='flex flex-col gap-4'>
            {/* Bouton de retour */}
            {onBack && (
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-primary hover:underline flex items-center gap-2"
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
            </div>

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
            />

            {/* Section : Bouton d'action */}
            <div className="text-right text-xs md:text-sm lg:text-base">
                <button
                    type="button"
                    className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl"
                    onClick={() => alert("Téléchargement en cours...")}
                >
                    Télécharger
                </button>
            </div>

            <div className='flex items-center justify-items-start gap-4 hover:cursor-pointer'>
                <span className='text-primary font-extrabold'>Générer la fiche d'évaluation synthétique</span>
                <img src='/images/pdf.svg' className='h-8 w-8'/>
            </div>
        </form>
    )
}

export default DetailEvaluation