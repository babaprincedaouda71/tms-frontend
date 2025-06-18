import React, {useCallback} from 'react';
import StatusRenderer from "@/components/Tables/StatusRenderer";
import DynamicActionsRenderer from "@/components/Tables/DynamicActionsRenderer";
import {statusConfig} from "@/config/tableConfig";
import {NEED_TO_ADD_TO_PLAN_URLS, TRAINING_URLS} from "@/config/urls";
import {PlanAnnualExerciceProps, TrainingProps} from "@/types/dataTypes";
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";
import {TRAINING_ACTIONS_TO_SHOW} from "@/config/plans/planExercicesTableConfig";

interface usePlanTableRendererProps {
    openCancelModal: (training?: TrainingProps) => void;
    handleThemeClick: (row: PlanAnnualExerciceProps) => void;
    exercice?: string | string[];
    planId?: string | string[];
}

export const useTrainingTableRenderer = ({
                                             openCancelModal,
                                             handleThemeClick,
                                             exercice,
                                             planId,
                                         }: usePlanTableRendererProps) => {
    const {buildRoleBasedPath, navigateTo} = useRoleBasedNavigation();

    return {
        theme: useCallback((value: string, row: PlanAnnualExerciceProps) => (
            <div
                onClick={() => handleThemeClick(row)}
                className="hover:underline cursor-pointer"
            >
                {value}
            </div>
        ), [handleThemeClick]),

        status: useCallback((value: string, row: PlanAnnualExerciceProps) => (
            <StatusRenderer
                value={value}
                groupeConfig={statusConfig}
                row={row}
                statusOptions={["Non_Planifié", "Planifié", "Terminé"]}
                apiUrl={TRAINING_URLS.updateStatus}
                mutateUrl={TRAINING_URLS.mutate}
            />
        ), []),

        actions: useCallback((_: any, row: TrainingProps) => (
            <DynamicActionsRenderer
                actions={TRAINING_ACTIONS_TO_SHOW}
                row={row}
                deleteUrl={NEED_TO_ADD_TO_PLAN_URLS.removeTheme}
                openCancelModal={() => openCancelModal(row)}
                // Utiliser customViewHandler au lieu de viewUrl pour rediriger vers les détails du thème
                customViewHandler={() => {
                    navigateTo(`/Plan/annual/${exercice}/${row.theme}`, {
                        query: {
                            id: row.id,
                        }
                    });
                }}
                customEditHandler={(row) => {
                    navigateTo(buildRoleBasedPath(`/Plan/annual/${exercice}/editTraining`), {
                        query: {
                            trainingId: row.id,
                            exercice: exercice,
                            planId: planId,
                        }
                    });
                }}
                mutateUrl={`${TRAINING_URLS.mutate}/${planId}`}
                confirmMessage={`Êtes-vous sûr de vouloir supprimer le plan ${row.theme} ?`}
            />
        ), [buildRoleBasedPath, openCancelModal, navigateTo, exercice, planId]),
    };
};