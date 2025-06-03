import React, {useCallback, useMemo, useState} from 'react'
import Table from '@/components/Tables/Table/index'
import ModalButton from '@/components/ModalButton'
import SearchFilterAddBar from '@/components/SearchFilterAddBar'
import {PlanAnnualExerciceProps, TrainingProps} from '@/types/dataTypes'
import Modal from '@/components/Modal'
import {useRouter} from 'next/router'
import {handleSort} from '@/utils/sortUtils'
import useTable from '@/hooks/useTable'
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";
import {
    TRAINING_RECORDS_PER_PAGE,
    TRAINING_TABLE_HEADERS,
    TRAINING_TABLE_KEYS,
} from "@/config/plans/planExercicesTableConfig";
import {useTrainingTableRenderer} from "@/hooks/plans/useTrainingTableRenderer";
import ProtectedRoute from "@/components/ProtectedRoute";
import {UserRole} from "@/contexts/AuthContext";
import useSWR from "swr";
import {TRAINING_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";

const TrainingPage = () => {
    const router = useRouter();

    const {exercice, planId} = router.query;
    const {
        data: trainingData,
        mutate,
        error,
        isLoading
    } = useSWR<TrainingProps[]>(`${TRAINING_URLS.mutate}/${planId}`, fetcher)

    const memorizedTrainingData = useMemo(() => trainingData || [], [trainingData]);

    const {navigateTo, isCurrentPath, getPathWithoutRolePrefix} = useRoleBasedNavigation();
    const {
        currentPage,
        visibleColumns,
        setCurrentPage,
        handleSortData,
        toggleColumnVisibility,
        totalRecords,
        totalPages,
        sortableColumns,
        paginatedData,
    } = useTable(memorizedTrainingData, TRAINING_TABLE_HEADERS, TRAINING_TABLE_KEYS, TRAINING_RECORDS_PER_PAGE)

    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const openCancelModal = () => setCancelModalOpen(true);
    const closeCancelModal = () => setCancelModalOpen(false);
    const excludeIcon = <img src="/images/exclude.svg" className="h-7 w-7" onClick={openCancelModal}/>
    const handleCancel = () => {
        closeCancelModal();
        navigateTo("/Plan/annual/exercice/cancel")
    };


    const handleThemeClick = useCallback(
        (row: PlanAnnualExerciceProps): void => {
            if (row.theme) {
                navigateTo(`/Plan/annual/${exercice}/${row.theme}`, {
                    query: {
                        id: row.id,
                    }
                })
            }
        }, [navigateTo])

    const renderers = useTrainingTableRenderer({
        handleThemeClick,
        exercice,
        planId
    })

    const handleAddTheme = () => {
        navigateTo(`/Plan/annual/${exercice}/addTheme`, {
            query: {
                planId: planId,
                exercice: exercice
            }
        })
    }

    return (
        <ProtectedRoute requiredRole={UserRole.Admin}>
            <div className="font-title text-xs md:text-sm lg:text-base bg-white rounded-xl pt-6">
                <div className="flex items-start gap-2 md:gap-8">
                    <SearchFilterAddBar
                        isLeftButtonVisible={false}
                        isFiltersVisible={false}
                        isRightButtonVisible={true}
                        leftTextButton="Filtrer les colonnes"
                        rightTextButton="Ajouter des thèmes"
                        onRightButtonClick={handleAddTheme}
                        filters={[]}
                        placeholderText={"Recherche de plans"}
                    />
                    {/* Bouton pour afficher/masquer la fenêtre modale */}
                    <ModalButton
                        headers={TRAINING_TABLE_HEADERS}
                        visibleColumns={visibleColumns}
                        toggleColumnVisibility={toggleColumnVisibility}
                    />
                </div>

                {/* Tableau */}
                <Table
                    data={paginatedData}
                    keys={TRAINING_TABLE_KEYS}
                    headers={TRAINING_TABLE_HEADERS}
                    sortableCols={sortableColumns}
                    onSort={(column, order) => handleSortData(column, order, handleSort)}
                    isPagination
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: setCurrentPage,
                    }}
                    totalRecords={totalRecords}
                    loading={false}
                    onAdd={() => console.log("Nouveau")}
                    visibleColumns={visibleColumns}
                    renderers={renderers}
                />
            </div>
            {/* Cancel Modal */}
            <Modal
                isOpen={isCancelModalOpen}
                onClose={closeCancelModal}
                title={"Annulation"}
                subtitle={"Veuillez confirmer l'annulation de la session de formation"}
                actions={[
                    {label: "Non", onClick: closeCancelModal, className: "border"},
                    {
                        label: "Oui",
                        onClick: handleCancel,
                        className: "bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd text-white",
                    },
                ]} icon={excludeIcon}>
                <div className="flex flex-col justify-center space-y-2">
                    <div className="font-bold text-center">Voulez-vous vraiment annuler l'action de formation?</div>
                </div>
            </Modal>
        </ProtectedRoute>
    )
}

export default TrainingPage