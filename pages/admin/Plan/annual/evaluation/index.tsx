import ModalButton from '@/components/ModalButton'
import SearchFilterAddBar from '@/components/SearchFilterAddBar'
import StatusRenderer from '@/components/Tables/StatusRenderer'
import Table from '@/components/Tables/Table/index'
import {GroupeEvaluationProps} from '@/types/dataTypes'
import React, {useMemo, useState} from 'react'
import EvaluationForm from './add'
import DetailEvaluation from './detail'
import {handleSort} from '@/utils/sortUtils'
import {statusConfig} from '@/config/tableConfig'
import useTable from '@/hooks/useTable'
import DynamicActionsRenderer from '@/components/Tables/DynamicActionsRenderer'
import useSWR from "swr";
import {GROUPE_EVALUATION_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";
import {useRouter} from "next/router";

const TABLE_HEADERS = [
    "Label",
    "Type",
    "Date de création",
    "Statut",
    "Actions",
];
const TABLE_KEYS = [
    "label",
    "type",
    "creationDate",
    "status",
    "actions",
];

const ACTIONS_TO_SHOW = ["view", "edit", "delete"];
const RECORDS_PER_PAGE = 5;

const Evaluation = () => {
    // Récupération du trainingId et du groupId
    const router = useRouter();
    const {trainingId, groupId} = router.query;
    // Récupération des données via SWR
    const {
        data: groupeEvaluationData,
        error,
        mutate
    } = useSWR<GroupeEvaluationProps[]>(GROUPE_EVALUATION_URLS.mutate + `/${trainingId}/${groupId}`, fetcher);

    // Mémorisation des données
    const memorizedData = useMemo(() => groupeEvaluationData || [], [groupeEvaluationData]);
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
        memorizedData,
        TABLE_HEADERS,
        TABLE_KEYS,
        RECORDS_PER_PAGE
    )

    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GroupeEvaluationProps | null>(null);

    const handleLabelClick = (row: GroupeEvaluationProps) => {
        setSelectedItem(row);
        setShowDetails(true);
        setShowForm(false);
    };

    const renderers = {
        label: (value: string, row: GroupeEvaluationProps) => (
            <button
                onClick={() => handleLabelClick(row)}
                className="hover:text-primary hover:underline"
            >
                {value}
            </button>
        ),
        status: (value: string) => (
            <StatusRenderer value={value} groupeConfig={statusConfig}/>
        ),
        actions: (_: any, row: GroupeEvaluationProps) =>
            <DynamicActionsRenderer actions={ACTIONS_TO_SHOW} row={row}/>
    };

    const handleAdd = () => {
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
    };


    return (
        <div className="mx-auto bg-white font-title rounded-lg px-6 pb-2 pt-6">
            {!showForm ? !showDetails ? (
                <>
                    <div className="flex items-start gap-2 md:gap-8 mt-4">
                        <SearchFilterAddBar
                            isLeftButtonVisible={false}
                            isFiltersVisible={false}
                            isRightButtonVisible={true}
                            leftTextButton="Filtrer les colonnes"
                            rightTextButton="Nouvelle"
                            onRightButtonClick={handleAdd}
                            filters={[]}
                            placeholderText={"Recherche..."}
                        />
                        <ModalButton
                            headers={TABLE_HEADERS}
                            visibleColumns={visibleColumns}
                            toggleColumnVisibility={toggleColumnVisibility}
                        />
                    </div>
                    <Table
                        data={paginatedData}
                        keys={TABLE_KEYS}
                        headers={TABLE_HEADERS}
                        sortableCols={sortableColumns}
                        onSort={(column, order) => handleSortData(column, order, handleSort)}
                        isPagination={false}
                        totalRecords={totalRecords}
                        loading={false}
                        onAdd={handleAdd}
                        visibleColumns={visibleColumns}
                        renderers={renderers}
                    />
                </>
            ) : (
                <DetailEvaluation/>
            ) : (<EvaluationForm onClick={handleCancel}/>)}
        </div>
    )
}

export default Evaluation