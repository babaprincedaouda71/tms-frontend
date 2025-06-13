import Table from '@/components/Tables/Table/index'
import React, {useMemo, useState} from 'react'
import {AccountingsProps} from '@/types/dataTypes'
import StatusRenderer from '@/components/Tables/StatusRenderer'
import SearchFilterAddBar from '@/components/SearchFilterAddBar'
import ModalButton from '@/components/ModalButton'
import AddFee from './addFee'
import {handleSort} from '@/utils/sortUtils'
import {statusConfig} from '@/config/tableConfig'
import DynamicActionsRenderer from '@/components/Tables/DynamicActionsRenderer'
import useTable from '@/hooks/useTable'
import useSWR from "swr";
import {fetcher} from "@/services/api";
import {GROUPE_INVOICE_URLS} from "@/config/urls";
import {useRouter} from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import {UserRole} from "@/contexts/AuthContext";

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
    const router = useRouter();
    // Récupération du groupe id depuis le router
    const {groupId} = router.query;
    // Récupération des données via SWR
    const {
        data: accountingData,
        error,
        mutate
    } = useSWR<AccountingsProps[]>(GROUPE_INVOICE_URLS.mutate + `/${groupId}`, fetcher);

    // Mémorisation des données
    const memoizeData = useMemo(() => accountingData || [], [accountingData]);
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
        memoizeData,
        TABLE_HEADERS,
        TABLE_KEYS,
        RECORDS_PER_PAGE
    )

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

    // Fonction pour gérer le retour à la liste (fermer le formulaire)
    const handleBackToList = () => {
        setShowForm(false);
    };

    // Fonction pour gérer le succès de soumission
    const handleSubmitSuccess = async () => {
        // Actualiser les données via SWR
        await mutate();
        // Fermer le formulaire
        setShowForm(false);
    };

    return (
        <ProtectedRoute requiredRole={UserRole.Admin}>
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
                        loading={!accountingData && !error}
                        onAdd={() => null}
                        visibleColumns={visibleColumns}
                        renderers={renderers}
                    />
                </>
            ) : (
                <AddFee
                    onCancel={handleBackToList}
                    onSuccess={handleSubmitSuccess}
                />
            )}
        </ProtectedRoute>
    )
}

export default Accounting