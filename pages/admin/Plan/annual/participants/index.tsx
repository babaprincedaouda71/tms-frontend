import React, {useEffect, useState} from 'react'; // Import useEffect
import {TrainingInvitationProps, UserProps} from '@/types/dataTypes';
import useSWR from "swr";

// Components
import InputField from '@/components/FormComponents/InputField';
import Table from '@/components/Tables/Table/index';
import StatusRenderer from '@/components/Tables/StatusRenderer';
import {handleSort} from '@/utils/sortUtils';
import {statusConfig} from '@/config/tableConfig';
import DynamicActionsRenderer from '@/components/Tables/DynamicActionsRenderer';
import {TRAINING_GROUPE_URLS, USERS_URLS} from '@/config/urls';
import {fetcher} from '@/services/api';
import useTable from '@/hooks/useTable';
import Alert from '@/components/Alert';
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";
import Modal from "@/components/Modal";

const TABLE_HEADERS_1 = ["Code", "Nom", "Prénoms", "Poste", "Niveau", "Manager", "Sélection"];
const TABLE_HEADERS_2 = ["Nom", "Date d'invitation", "État", "Actions"];
const TABLE_KEYS_1 = ["code", "firstName", "lastName", "position", "level", "manager", "selection"];
const TABLE_KEYS_2 = ["userFullName", "invitationDate", "status", "actions"];

const ACTIONS_TO_SHOW = ["cancel"];
const RECORDS_PER_PAGE = 5;

// Définir une interface pour les données du groupe, incluant les IDs des utilisateurs sélectionnés
interface GroupData {
    id?: number;
    targetAudience: string;
    managerCount: number;
    employeeCount: number;
    workerCount: number;
    temporaryWorkerCount: number;
    userGroupIds: number[];
    dates?: string[]; // Ajout des dates pour le tableau de présence
}

interface ParticipantsProps {
    trainingId: string | string[] | undefined;
    groupId: string | string[] | undefined;
    groupData?: GroupData;
    onGroupDataUpdated: (newGroupData: GroupData) => void;
}

const Participants = ({trainingId, groupData, onGroupDataUpdated, groupId}: ParticipantsProps) => {
    const {navigateTo} = useRoleBasedNavigation();
    // état pour gérer les alertes
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
    const [isSubmitting, setIsSubmitting] = useState(false);

    //
    const [isSendInvitationModalOpen, setIsSendInvitationModalOpen] = useState(false);
    const openSendInvitationModal = () => {
        setIsSendInvitationModalOpen(true);
    }
    const closeSendInvitationModal = () => {
        setIsSendInvitationModalOpen(false);
    };

    const handleGoToSendInvitationPage = () => {
        closeSendInvitationModal();
        navigateTo(`/Plan/annual/sendInvitation`, {
            query: {
                trainingId: trainingId,
                groupId: groupId,
            }
        });
    }

    const handleCloseAlert = () => {
        setShowAlert(false);
        setAlertMessage('');
    };
    // form data
    const [formData, setFormData] = useState({
        targetAudience: '',
        staff: 0,
        managerCount: 0,
        employeeCount: 0,
        workerCount: 0,
        temporaryWorkerCount: 0,
    });

    // État pour gérer l'erreur de validation de l'effectif
    const [staffError, setStaffError] = useState('');

    // Data and State
    const {
        data: initialUsersData,
        error: initialUsersError,
        isLoading: initialUsersLoading
    } = useSWR<UserProps[]>(USERS_URLS.mutate, fetcher); // Ajoutez error et isLoading pour une meilleure gestion
    const [users, setUsers] = useState<UserProps[]>([]); // Utilisateurs disponibles à sélectionner
    const [selectedUsers, setSelectedUsers] = useState<UserProps[]>([]); // Utilisateurs déjà sélectionnés pour le groupe
    const [tempSelectedUsers, setTempSelectedUsers] = useState<Set<string>>(new Set()); // Pour suivre les sélections temporaires dans la première table

    // Nouveau state pour les participants confirmés (ceux dans le backend)
    const [confirmedParticipants, setConfirmedParticipants] = useState<TrainingInvitationProps[]>([]);

    useEffect(() => {
        if (initialUsersData) {
            if (groupData) {
                setFormData({
                    targetAudience: groupData.targetAudience || '',
                    managerCount: groupData.managerCount || 0,
                    employeeCount: groupData.employeeCount || 0,
                    workerCount: groupData.workerCount || 0,
                    temporaryWorkerCount: groupData.temporaryWorkerCount || 0,
                    staff: groupData.managerCount + groupData.employeeCount + groupData.workerCount + groupData.temporaryWorkerCount || 0,
                });

                const selectedIds = new Set((groupData.userGroupIds || []).map(id => id));
                const usersForEdit = initialUsersData.filter(user => !selectedIds.has(user.id));
                const confirmedUsersForEdit = initialUsersData.filter(user => selectedIds.has(user.id));

                setUsers(usersForEdit);
                setConfirmedParticipants(confirmedUsersForEdit);
                setSelectedUsers([]); // Réinitialiser les sélections temporaires

                const sumLoadedCounts = (groupData.managerCount || 0) + (groupData.employeeCount || 0) + (groupData.workerCount || 0) + (groupData.temporaryWorkerCount || 0);
                if (formData.staff !== 0 && sumLoadedCounts !== formData.staff) {
                    setStaffError('La somme des effectifs chargés (' + sumLoadedCounts + ') ne correspond pas à l\'effectif total chargé (' + formData.staff + ').');
                } else {
                    setStaffError('');
                }
            } else {
                console.log("Mode Ajout: Initialisation avec tous les utilisateurs");
                setUsers(initialUsersData);
                setSelectedUsers([]);
                setConfirmedParticipants([]);
                setFormData({
                    targetAudience: '',
                    staff: 0,
                    managerCount: 0,
                    employeeCount: 0,
                    workerCount: 0,
                    temporaryWorkerCount: 0,
                });
                setStaffError('');
            }
        } else if (initialUsersError) {
            console.error("Erreur lors du chargement des utilisateurs initiaux:", initialUsersError);
        }
    }, [groupData, initialUsersData, initialUsersError]);

    // Hooks useTable pour le premier tableau (utilisateurs disponibles)
    const {
        currentPage: currentPageUsers,
        visibleColumns: visibleColumnsUsers,
        setCurrentPage: setCurrentPageUsers,
        handleSortData: handleSortDataUsers,
        totalPages: totalPagesUsers,
        totalRecords: totalRecordsUsers,
        paginatedData: paginatedUsersData,
        sortableColumns: sortableColumnsUsers,
    } = useTable(
        users,
        TABLE_HEADERS_1,
        TABLE_KEYS_1,
        RECORDS_PER_PAGE,
    );

    // Hooks useTable pour le deuxième tableau (participants confirmés)
    const {
        currentPage: currentPageConfirmed,
        visibleColumns: visibleColumnsConfirmed,
        setCurrentPage: setCurrentPageConfirmed,
        handleSortData: handleSortDataConfirmed,
        totalPages: totalPagesConfirmed,
        totalRecords: totalRecordsConfirmed,
        paginatedData: paginatedConfirmedData,
        sortableColumns: sortableColumnsConfirmed,
    } = useTable(
        confirmedParticipants,
        TABLE_HEADERS_2,
        TABLE_KEYS_2,
        RECORDS_PER_PAGE,
    );

    // Renderers restent les mêmes
    const renderers1 = {
        selection: (_: string, row: UserProps) => (
            <div className="flex justify-center items-center">
                <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    checked={tempSelectedUsers.has(row.id.toString())}
                    onChange={(e) => {
                        const newTempSelectedUsers = new Set(tempSelectedUsers);
                        if (e.target.checked) {
                            newTempSelectedUsers.add(row.id.toString());
                        } else {
                            newTempSelectedUsers.delete(row.id.toString());
                        }
                        setTempSelectedUsers(newTempSelectedUsers);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Sélectionner ${row.firstName + ' ' + row.lastName}`}
                />
            </div>
        ),
    };

    const handleCancelSelected = (userToRemove: UserProps) => {
        setConfirmedParticipants(confirmedParticipants.filter(user => user.id !== userToRemove.id));
        setUsers([...users, userToRemove]);
    };

    const renderers2 = {
        status: (value: string) => (
            <StatusRenderer value={value} groupeConfig={statusConfig}/>
        ),
        actions: (_: any, row: UserProps) => (
            <DynamicActionsRenderer
                actions={ACTIONS_TO_SHOW}
                row={row}
                openCancelModal={() => handleCancelSelected(row)}
            />
        ),
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        let newValue;
        if (name === 'staff' || name.endsWith('Count')) {
            newValue = value === '' ? '' : parseInt(value, 10) || 0;
        } else {
            newValue = value;
        }
        setFormData(prev => {
            const nextFormData = {...prev, [name]: newValue};
            if (name === 'staff' || name.endsWith('Count')) {
                validateStaffCount(nextFormData);
            }
            return nextFormData;
        });
    };

    const validateStaffCount = (currentFormData: typeof formData) => {
        const {staff, managerCount, employeeCount, workerCount, temporaryWorkerCount} = currentFormData;
        const numStaff = typeof staff === 'number' ? staff : parseInt(staff as any, 10) || 0;
        const numManager = typeof managerCount === 'number' ? managerCount : parseInt(managerCount as any, 10) || 0;
        const numEmployee = typeof employeeCount === 'number' ? employeeCount : parseInt(employeeCount as any, 10) || 0;
        const numWorker = typeof workerCount === 'number' ? workerCount : parseInt(workerCount as any, 10) || 0;
        const numTemporary = typeof temporaryWorkerCount === 'number' ? temporaryWorkerCount : parseInt(temporaryWorkerCount as any, 10) || 0;

        const sumOfCounts = numManager + numEmployee + numWorker + numTemporary;

        if ((numStaff !== 0 || sumOfCounts !== 0) && sumOfCounts !== numStaff) {
            setStaffError(`La somme des effectifs (${sumOfCounts}) doit être égale à l'effectif total (${numStaff}).`);
        } else {
            setStaffError('');
        }
    };

    // Nouvelle fonction pour ajouter des participants (soumission au backend)
    const handleAddToSelected = async () => {
        if (tempSelectedUsers.size === 0) return;

        const usersToAdd = users.filter(user => tempSelectedUsers.has(user.id.toString()));
        const {targetAudience, managerCount, employeeCount, workerCount, temporaryWorkerCount} = formData;

        const numManager = typeof managerCount === 'number' ? managerCount : parseInt(managerCount as any, 10) || 0;
        const numEmployee = typeof employeeCount === 'number' ? employeeCount : parseInt(employeeCount as any, 10) || 0;
        const numWorker = typeof workerCount === 'number' ? workerCount : parseInt(workerCount as any, 10) || 0;
        const numTemporary = typeof temporaryWorkerCount === 'number' ? temporaryWorkerCount : parseInt(temporaryWorkerCount as any, 10) || 0;

        const selectedUserIds = [...confirmedParticipants.map(user => user.id), ...usersToAdd.map(user => user.id)];

        const dataToSend = {
            id: groupData?.id,
            targetAudience,
            managerCount: numManager,
            employeeCount: numEmployee,
            workerCount: numWorker,
            temporaryWorkerCount: numTemporary,
            userGroupIds: selectedUserIds,
        };

        setIsSubmitting(true);
        try {
            const url = groupData ?
                `${TRAINING_GROUPE_URLS.editGroupParticipants}/${groupData.id}` :
                `${TRAINING_GROUPE_URLS.addGroupParticipants}/${trainingId}`;
            const method = groupData ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                const responseData: GroupData = await response.json();
                onGroupDataUpdated(responseData);

                // Mettre à jour les états locaux
                setConfirmedParticipants([...confirmedParticipants, ...usersToAdd]);
                setUsers(users.filter(user => !tempSelectedUsers.has(user.id.toString())));
                setTempSelectedUsers(new Set());

                setAlertMessage('Participants ajoutés avec succès !');
                setAlertType('success');
                setShowAlert(true);
            } else {
                const errorData = await response.json();
                console.error('Erreur lors de l\'ajout des participants:', errorData);
                setAlertMessage('Erreur lors de l\'ajout des participants');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout des participants:', error);
            setAlertMessage('Erreur lors de l\'ajout des participants');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Optionnel: Afficher un indicateur de chargement ou une erreur pendant le fetch initial
    if (initialUsersLoading) {
        return <div>Chargement des utilisateurs...</div>;
    }

    if (initialUsersError) {
        return <div>Erreur lors du chargement des données.</div>;
    }

    // Nouvelle fonction pour envoyer les invitations
    const handleSendInvitations = async () => {
        if (confirmedParticipants.length === 0) {
            setAlertMessage('Aucun participant à inviter');
            setAlertType('warning');
            setShowAlert(true);
            return;
        }

        setIsSubmitting(true);

        closeSendInvitationModal();
        navigateTo(`/Plan/annual/sendInvitation`, {
            query: {
                trainingId: trainingId,
                groupId: groupData?.id,
            }
        });

        setIsSubmitting(false);
    };

    // Créer les données pour le tableau de présence
    const createAttendanceTableData = () => {
        const dates = groupData?.dates || [];
        const attendanceData = [
            {
                type: 'Liste de présence interne',
                ...dates.reduce((acc, date, index) => {
                    acc[`date_${index}`] = 'PDF'; // Placeholder pour le PDF
                    return acc;
                }, {} as Record<string, string>)
            },
            {
                type: 'Liste de présence CSF',
                ...dates.reduce((acc, date, index) => {
                    acc[`date_${index}`] = 'PDF'; // Placeholder pour le PDF
                    return acc;
                }, {} as Record<string, string>)
            }
        ];
        return attendanceData;
    };

    const createAttendanceHeaders = () => {
        const dates = groupData?.dates || [];
        return ['Type', ...dates];
    };

    const createAttendanceKeys = () => {
        const dates = groupData?.dates || [];
        return ['type', ...dates.map((_, index) => `date_${index}`)];
    };

    if (initialUsersLoading) {
        return <div>Chargement des utilisateurs...</div>;
    }

    if (initialUsersError) {
        return <div>Erreur lors du chargement des données.</div>;
    }


    return (
        <form className=''> {/* Utiliser e.preventDefault() pour éviter le rechargement de page */}
            {showAlert && (
                <Alert
                    message={alertMessage}
                    type={alertType}
                    onClose={handleCloseAlert}
                />
            )}
            {/* Form Fields */}
            <div className="grid md:grid-cols-2 md:gap-10 gap-4">
                <div>
                    <InputField
                        label="Public cible"
                        name="targetAudience"
                        value={formData.targetAudience} // Lier la valeur à l'état du formulaire
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <InputField
                        type='number'
                        label="Éffectif"
                        name="staff"
                        value={formData.staff} // Lier la valeur à l'état du formulaire
                        onChange={handleInputChange}
                    />
                    {staffError && <p className="text-red text-sm">{staffError}</p>}
                    <div className="grid lg:grid-cols-2 grid-cols-1 gap-5 mt-5">
                        <InputField
                            type='number'
                            label="Manager"
                            name="managerCount"
                            value={formData.managerCount} // Lier la valeur à l'état du formulaire
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Employé"
                            name="employeeCount"
                            value={formData.employeeCount} // Lier la valeur à l'état du formulaire
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Ouvrier"
                            name="workerCount"
                            value={formData.workerCount} // Lier la valeur à l'état du formulaire
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Temporaire"
                            name="temporaryWorkerCount"
                            value={formData.temporaryWorkerCount} // Lier la valeur à l'état du formulaire
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>

            {/* Tables and Buttons */}
            <div className="mt-10">
                <h3 className="text-lg font-semibold mb-4">Sélectionner les participants</h3>
                <Table
                    data={paginatedUsersData}
                    keys={TABLE_KEYS_1}
                    headers={TABLE_HEADERS_1}
                    sortableCols={sortableColumnsUsers}
                    onSort={(column, order) => handleSortDataUsers(column, order, handleSort)}
                    isPagination={false}
                    pagination={{
                        currentPage: currentPageUsers,
                        totalPages: totalPagesUsers,
                        onPageChange: setCurrentPageUsers,
                    }}
                    totalRecords={totalRecordsUsers}
                    visibleColumns={visibleColumnsUsers}
                    renderers={renderers1}
                    loading={initialUsersLoading}
                />
                <div className="text-right text-xs md:text-sm lg:text-base mt-2">
                    <button
                        type="button"
                        className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleAddToSelected}
                        disabled={tempSelectedUsers.size === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Ajout en cours...' : `Ajouter à la liste (${tempSelectedUsers.size})`}
                    </button>
                </div>
            </div>
            {/* Deuxième tableau - Participants confirmés */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Participants confirmés</h3>
                <Table
                    data={paginatedConfirmedData}
                    keys={TABLE_KEYS_2}
                    headers={TABLE_HEADERS_2}
                    sortableCols={sortableColumnsConfirmed}
                    onSort={(column, order) => handleSortDataConfirmed(column, order, handleSort)}
                    isPagination={false}
                    pagination={{
                        currentPage: currentPageConfirmed,
                        totalPages: totalPagesConfirmed,
                        onPageChange: setCurrentPageConfirmed,
                    }}
                    totalRecords={totalRecordsConfirmed}
                    loading={initialUsersLoading}
                    visibleColumns={visibleColumnsConfirmed}
                    renderers={renderers2}
                />
                <div className="text-right text-xs md:text-sm lg:text-base mt-2">
                    <button
                        type="button"
                        className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={openSendInvitationModal}
                        disabled={confirmedParticipants.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer une invitation aux participants'}
                    </button>
                </div>
            </div>

            {/* Troisième tableau - Listes de présence */}
            {groupData?.dates && groupData.dates.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Listes de présence</h3>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left bg-primary text-white font-medium tracking-wider">
                                    Type
                                </th>
                                {groupData.dates.map((date, index) => (
                                    <th key={index}
                                        className="px-4 py-3 text-center font-medium text-white bg-primary tracking-wider">
                                        {date}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                                    Liste de présence interne
                                </td>
                                {groupData.dates.map((_, index) => (
                                    <td key={index} className="px-4 py-4 whitespace-nowrap text-center">
                                        <button
                                            className="bg-red text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">
                                            PDF
                                        </button>
                                    </td>
                                ))}
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                                    Liste de présence CSF
                                </td>
                                {groupData.dates.map((_, index) => (
                                    <td key={index} className="px-4 py-4 whitespace-nowrap text-center">
                                        <button
                                            className="bg-red text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">
                                            PDF
                                        </button>
                                    </td>
                                ))}
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            <Modal
                isOpen={isSendInvitationModalOpen}
                onClose={closeSendInvitationModal}
                title={"Invitation"}
                subtitle={"Veuillez confirmer"}
                actions={[
                    {label: "Non", onClick: closeSendInvitationModal, className: "border"},
                    {
                        label: "Oui",
                        onClick: handleGoToSendInvitationPage,
                        className: "bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd text-white",
                    },
                ]} icon={""}>
                <div className="flex flex-col justify-center space-y-2">
                    <div className="font-bold text-center">
                        Vous êtes sur le point d'envoyer une invitation aux participants
                    </div>
                </div>
            </Modal>
        </form>
    );
};

export default Participants;