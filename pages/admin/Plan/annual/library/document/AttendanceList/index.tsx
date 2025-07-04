import FileInputField from '@/components/FormComponents/FileInputField';
import StatusRenderer from '@/components/Tables/StatusRenderer';
import Table from '@/components/Tables/Table/index';
import {statusConfig} from '@/config/tableConfig';
import useTable from '@/hooks/useTable';
import {PlanGroupUserProps} from '@/types/dataTypes';
import {handleSort} from '@/utils/sortUtils';
import {planGroupUserData} from '@/data/planGroupUserData';
import React, {useMemo} from 'react'
import useSWR from "swr";
import {TRAINING_GROUPE_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";
import {useRouter} from "next/router";

const TABLE_HEADERS = [
    "Nom",
    "Prénoms",
    "CIN",
    "CNSS",
    "Confirmation",
];
const TABLE_KEYS = [
    "firstName",
    "lastName",
    "cin",
    "cnss",
    "confirmation",
];

// Interfaces
interface AttendanceRecord {
    recordId: string;
    userId: number;
    userFullName: string;
    userCode: string;
    userEmail: string;
    status: string; // "PRESENT" ou "ABSENT"
    statusDescription: string; // "présent" ou "absent"
    markedDate: string | null;
    canEdit: boolean;
}

const RECORDS_PER_PAGE = 4;

const PresenceList = () => {
    const router = useRouter();
    const {groupId} = router.query;
    const {
        data: dateData,
        error,
        mutate
    } = useSWR(TRAINING_GROUPE_URLS.getGroupDates + `/${groupId}`, fetcher)

    const memorizedDateData = useMemo(() => dateData || [], [dateData]);
    console.log(memorizedDateData)
    const {
        currentPage,
        visibleColumns,
        setCurrentPage,
        handleSortData,
        totalRecords,
        totalPages,
        sortableColumns,
        paginatedData,
    } = useTable<PlanGroupUserProps>(planGroupUserData, TABLE_HEADERS, TABLE_KEYS, RECORDS_PER_PAGE)

    const renderers = {
        confirmation: (value: string) => (
            <StatusRenderer value={value} groupeConfig={statusConfig}/>
        ),
    };
    return (
        <div className='space-y-10'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/*<InputField label="Choisissez une date" name='date' type='date' onChange={() => null}*/}
                {/*            labelClassName='font-extrabold' className='col-span-2'/>*/}
            </div>
            <div className='space-y-2'>
                <div className='font-extrabold'>La liste de présence du <span className='text-primary'>10/01/2025</span>
                </div>
                <Table
                    data={paginatedData}
                    keys={TABLE_KEYS}
                    headers={TABLE_HEADERS}
                    sortableCols={sortableColumns}
                    onSort={(column, order) => handleSortData(column, order, handleSort)}
                    isPagination={false}
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
                <FileInputField label='Liste de présence émargée' name='presenceFile' onChange={() => null}
                                inputClassName='w-1/3' labelClassName='font-extrabold'/>
            </div>
        </div>
    )
}

export default PresenceList