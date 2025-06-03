import React, {useMemo} from "react";
import Table from "@/components/Tables/Table/index";
import {PlaningDataProps} from "@/types/dataTypes";
import SearchFilterAddBar from "@/components/SearchFilterAddBar";
import useTable from "@/hooks/useTable";
import {handleSort} from "@/utils/sortUtils";

const TABLE_HEADERS = ["Thème", "Dates de formation"];
const TABLE_KEYS = ["theme", "dates"];

const RECORDS_PER_PAGE = 4;

const Planning = ({planingData}) => {
    const {
        data: allData,
        currentPage,
        visibleColumns,
        setCurrentPage,
        handleSortData,
    } = useTable<PlaningDataProps>(planingData, TABLE_HEADERS, TABLE_KEYS, RECORDS_PER_PAGE)

    const totalRecords = allData.length;
    const totalPages = useMemo(() => Math.ceil(totalRecords / RECORDS_PER_PAGE), [totalRecords]);

    // Sortable Columns
    const sortableColumns = useMemo(
        () => TABLE_HEADERS.filter((TABLE_HEADERS) => !["Actions", "Sélection"].includes(TABLE_HEADERS)),
        []
    );

    // Pagination des données
    const paginatedData = useMemo(
        () => allData.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE),
        [allData, currentPage]
    );
    return (
        <div>
            <div className="flex items-start gap-2 md:gap-8">
                <SearchFilterAddBar
                    isLeftButtonVisible={false}
                    isFiltersVisible={false}
                    isRightButtonVisible={false}
                    leftTextButton="Filtrer les colonnes"
                    rightTextButton="Nouveau"
                    onRightButtonClick={() => console.log("Nouveau button clicked")}
                    filters={[]}
                    placeholderText={"Rechercher une formation"}
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
            />
        </div>
    );
};

export default Planning;