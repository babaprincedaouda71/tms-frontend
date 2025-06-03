import React, {useCallback} from 'react';
import StatusRenderer from "@/components/Tables/StatusRenderer";
import DynamicActionsRenderer from "@/components/Tables/DynamicActionsRenderer";
import {statusConfig} from "@/config/tableConfig"; // Ces configs peuvent venir de tableConfig.ts
import {NEED_TO_ADD_TO_PLAN_URLS, TRAINING_URLS} from "@/config/urls";
import {PlanAnnualExerciceProps} from "@/types/dataTypes";
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation"; // Si navigateTo est utilisé dans les renderers
import {TRAINING_ACTIONS_TO_SHOW} from "@/config/plans/planExercicesTableConfig";

interface usePlanTableRendererProps {
    handleThemeClick: (row: PlanAnnualExerciceProps) => void;
    exercice?: string | string[];
    planId?: string | string[];
}

export const useTrainingTableRenderer = ({
                                             handleThemeClick,
                                             exercice,
                                             planId,
                                         }: usePlanTableRendererProps) => {
    const {buildRoleBasedPath, navigateTo} = useRoleBasedNavigation(); // Ou passez-le en prop si ce hook ne doit pas dépendre de useRoleBasedNavigation

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
                statusOptions={["Actif", "Inactif", "Suspendu", "Bloqué"]}
                apiUrl={TRAINING_URLS.updateStatus}
                mutateUrl={TRAINING_URLS.mutate}
            />
        ), []),

        actions: useCallback((_: any, row: PlanAnnualExerciceProps) => (
            <DynamicActionsRenderer
                actions={TRAINING_ACTIONS_TO_SHOW}
                row={row}
                deleteUrl={NEED_TO_ADD_TO_PLAN_URLS.removeTheme}
                viewUrl={buildRoleBasedPath(`${TRAINING_URLS.view}`)}
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
        ), [buildRoleBasedPath]),
    };
};