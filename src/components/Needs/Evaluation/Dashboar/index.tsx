import React, {useMemo} from "react";
import DashboardBar from "../../../DashbordBar";
import SearchFilterAddBar from "../../../SearchFilterAddBar";
import ModalButton from "../../../ModalButton";
import Table from "../../../Tables/Table/index";
import {NeedsEvaluationProps} from "../../../../types/dataTypes";
import StatusRenderer from "@/components/Tables/StatusRenderer";
import {statusConfig} from "@/config/tableConfig";
import {handleSort} from "@/utils/sortUtils";
import DynamicActionsRenderer from "@/components/Tables/DynamicActionsRenderer";
import useTable from "@/hooks/useTable";
import useSWR from "swr";
import {NEED_EVALUATION_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";

const TABLE_HEADERS = [
    "Domaine",
    "Thème",
    "Questionnaire",
    "Priorité",
    "Validé par",
    "Statut",
    "Actions",
];
const TABLE_KEYS = [
    "domaine",
    "theme",
    "questionnaire",
    "priority",
    "validatedBy",
    "status",
    "actions",
];

const ACTIONS_TO_SHOW = ["edit", "delete"];
const RECORDS_PER_PAGE = 4;

const NeedsEvaluationDashboard = () => {
    const {data: needEvaluationData} = useSWR<NeedsEvaluationProps[]>(NEED_EVALUATION_URLS.mutate, fetcher);

    const memorizedNeedEvaluationData = useMemo(() => needEvaluationData || [], [needEvaluationData]);
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
    } = useTable(
        memorizedNeedEvaluationData,
        TABLE_HEADERS,
        TABLE_KEYS,
        RECORDS_PER_PAGE)

    const renderers = {
        status: (value: string) => (
            <StatusRenderer value={value} groupeConfig={statusConfig}/>
        ),
        actions: (value: any, row: any) => (
            <DynamicActionsRenderer actions={ACTIONS_TO_SHOW} row={row}/>
        )
    };

    return (
        <div>
            <DashboardBar/>
            <div className="font-title text-xs md:text-sm lg:text-base bg-white rounded-xl pt-6">
                <div className="flex items-start gap-2 md:gap-8">
                    <SearchFilterAddBar
                        isLeftButtonVisible={false}
                        isFiltersVisible={false}
                        isRightButtonVisible={false}
                        leftTextButton="Filtrer les colonnes"
                        rightTextButton="Nouvelle"
                        filters={[]}
                        placeholderText={"Recherche de besoins"}
                    />
                    {/* Bouton pour afficher/masquer la fenêtre modale */}
                    <ModalButton
                        headers={TABLE_HEADERS}
                        visibleColumns={visibleColumns}
                        toggleColumnVisibility={toggleColumnVisibility}
                    />
                </div>

                {/* Tableau */}
                <Table
                    data={paginatedData}
                    keys={TABLE_KEYS}
                    headers={TABLE_HEADERS}
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
        </div>
    );
};

export default NeedsEvaluationDashboard;