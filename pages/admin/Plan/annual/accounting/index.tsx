import Table from '@/components/Tables/Table/index'
import React, {useState} from 'react'
import {accountingsData} from '@/data/accountingsData'
import {AccountingsProps} from '@/types/dataTypes'
import StatusRenderer from '@/components/Tables/StatusRenderer'
import SearchFilterAddBar from '@/components/SearchFilterAddBar'
import ModalButton from '@/components/ModalButton'
import AddFee from './addFee'
import {handleSort} from '@/utils/sortUtils'
import {statusConfig} from '@/config/tableConfig'
import DynamicActionsRenderer from '@/components/Tables/DynamicActionsRenderer'
import useTable from '@/hooks/useTable'

const TABLE_HEADERS = [
    "Type de frais",
    "Date de création",
    "Description",
    "Montant",
    "Statut du paiement",
    "Date de paiement",
    "Actions",
];
const TABLE_KEYS = [
    "type",
    "creationDate",
    "description",
    "amount",
    "status",
    "paymentDate",
    "actions",
];

const ACTIONS_TO_SHOW = ["edit", "delete"];
const RECORDS_PER_PAGE = 4;


const Accounting = () => {
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
    } = useTable<AccountingsProps>(accountingsData, TABLE_HEADERS, TABLE_KEYS, RECORDS_PER_PAGE)

    const [showForm, setShowForm] = useState(false);

    const renderers = {
        status: (value: string) => (
            <StatusRenderer value={value} groupeConfig={statusConfig}/>
        ),
        actions: (_: any, row: any) =>
            <DynamicActionsRenderer actions={ACTIONS_TO_SHOW} row={row}/>
    };

    const handleAdd = () => {
        setShowForm(true);
    };
    const handleCancel = () => {
        setShowForm(false);
    };
    return (
        <>
            {!showForm ? (
                <>
                    <div className="flex items-start gap-2 md:gap-8">
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
                        {/* Bouton pour afficher/masquer la fenêtre modale */}
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
                        isPagination={true}
                        pagination={{
                            currentPage,
                            totalPages,
                            onPageChange: setCurrentPage,
                        }}
                        totalRecords={totalRecords}
                        loading={false}
                        onAdd={() => null}
                        visibleColumns={visibleColumns}
                        renderers={renderers}
                    />
                </>
            ) : (<AddFee/>)}
        </>
    )
}

export default Accounting