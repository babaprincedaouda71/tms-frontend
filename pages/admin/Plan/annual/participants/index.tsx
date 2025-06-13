import React, {useEffect, useState} from 'react';
import {TrainingInvitationProps, UserProps} from '@/types/dataTypes';
import useSWR from "swr";

// Components
import InputField from '@/components/FormComponents/InputField';
import Table from '@/components/Tables/Table/index';
import StatusRenderer from '@/components/Tables/StatusRenderer';
import {handleSort} from '@/utils/sortUtils';
import {statusConfig} from '@/config/tableConfig';
import DynamicActionsRenderer from '@/components/Tables/DynamicActionsRenderer';
import {TRAINING_GROUPE_URLS, TRAINING_INVITATION_URLS, USERS_URLS} from '@/config/urls';
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

    // État pour gérer les alertes
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
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

    // Form data
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
    } = useSWR<UserProps[]>(USERS_URLS.mutate, fetcher);

    const [users, setUsers] = useState<UserProps[]>([]); // Utilisateurs disponibles à sélectionner
    const [tempSelectedUsers, setTempSelectedUsers] = useState<Set<string>>(new Set()); // Pour suivre les sélections temporaires dans la première table

    // État pour les invitations (second tableau)
    const [invitations, setInvitations] = useState<TrainingInvitationProps[]>([]);
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
    const [invitationsError, setInvitationsError] = useState<string | null>(null);

    // Fonction pour charger les invitations depuis le backend
    const fetchInvitations = async () => {
        if (!groupId) return;

        setIsLoadingInvitations(true);
        setInvitationsError(null);

        try {
            const response = await fetch(`${TRAINING_INVITATION_URLS.mutate}/${groupId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch invitations');
            }

            const data: TrainingInvitationProps[] = await response.json();
            setInvitations(data);
        } catch (error) {
            console.error('Error fetching invitations:', error);
            setInvitationsError('Erreur lors du chargement des invitations');
        } finally {
            setIsLoadingInvitations(false);
        }
    };

    // Charger les données initiales
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
                setUsers(usersForEdit);

                const sumLoadedCounts = (groupData.managerCount || 0) + (groupData.employeeCount || 0) + (groupData.workerCount || 0) + (groupData.temporaryWorkerCount || 0);
                if (formData.staff !== 0 && sumLoadedCounts !== formData.staff) {
                    setStaffError('La somme des effectifs chargés (' + sumLoadedCounts + ') ne correspond pas à l\'effectif total chargé (' + formData.staff + ').');
                } else {
                    setStaffError('');
                }
            } else {
                console.log("Mode Ajout: Initialisation avec tous les utilisateurs");
                setUsers(initialUsersData);
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

            // Charger les invitations après avoir initialisé les utilisateurs
            fetchInvitations();
        } else if (initialUsersError) {
            console.error("Erreur lors du chargement des utilisateurs initiaux:", initialUsersError);
        }
    }, [groupData, initialUsersData, initialUsersError, groupId]);

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

    // Hooks useTable pour le deuxième tableau (invitations)
    const {
        currentPage: currentPageInvitations,
        visibleColumns: visibleColumnsInvitations,
        setCurrentPage: setCurrentPageInvitations,
        handleSortData: handleSortDataInvitations,
        totalPages: totalPagesInvitations,
        totalRecords: totalRecordsInvitations,
        paginatedData: paginatedInvitationsData,
        sortableColumns: sortableColumnsInvitations,
    } = useTable(
        invitations,
        TABLE_HEADERS_2,
        TABLE_KEYS_2,
        RECORDS_PER_PAGE,
    );

    // Renderers pour le premier tableau
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

    // Fonction pour annuler une invitation
    const handleCancelInvitation = async (invitation: TrainingInvitationProps) => {
        try {
            const response = await fetch(`${TRAINING_INVITATION_URLS.cancel}/${invitation.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setAlertMessage('Invitation annulée avec succès');
                setAlertType('success');
                setShowAlert(true);

                // Recharger les invitations
                await fetchInvitations();

                // Optionnellement, ajouter l'utilisateur de retour dans la liste des utilisateurs disponibles
                // (cela nécessiterait de connaître les détails de l'utilisateur depuis l'invitation)
            } else {
                throw new Error('Erreur lors de l\'annulation de l\'invitation');
            }
        } catch (error) {
            console.error('Error canceling invitation:', error);
            setAlertMessage('Erreur lors de l\'annulation de l\'invitation');
            setAlertType('error');
            setShowAlert(true);
        }
    };

    // Renderers pour le second tableau
    const renderers2 = {
        status: (value: string) => (
            <StatusRenderer value={value} groupeConfig={statusConfig}/>
        ),
        actions: (_: any, row: TrainingInvitationProps) => (
            <DynamicActionsRenderer
                actions={ACTIONS_TO_SHOW}
                row={row}
                openCancelModal={() => handleCancelInvitation(row)}
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

    // Fonction pour ajouter des participants (soumission au backend)
    const handleAddToSelected = async () => {
        if (tempSelectedUsers.size === 0) return;

        const usersToAdd = users.filter(user => tempSelectedUsers.has(user.id.toString()));
        const {targetAudience, managerCount, employeeCount, workerCount, temporaryWorkerCount} = formData;

        const numManager = typeof managerCount === 'number' ? managerCount : parseInt(managerCount as any, 10) || 0;
        const numEmployee = typeof employeeCount === 'number' ? employeeCount : parseInt(employeeCount as any, 10) || 0;
        const numWorker = typeof workerCount === 'number' ? workerCount : parseInt(workerCount as any, 10) || 0;
        const numTemporary = typeof temporaryWorkerCount === 'number' ? temporaryWorkerCount : parseInt(temporaryWorkerCount as any, 10) || 0;

        // Récupérer les IDs existants depuis les invitations + les nouveaux utilisateurs
        const existingUserIds = invitations.map(inv => parseInt(inv.id)); // Assuming invitation.id corresponds to userId
        const selectedUserIds = [...existingUserIds, ...usersToAdd.map(user => user.id)];

        console.log('Selected user IDs:', selectedUserIds);

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
                setUsers(users.filter(user => !tempSelectedUsers.has(user.id.toString())));
                setTempSelectedUsers(new Set());

                // Recharger les invitations depuis le backend
                await fetchInvitations();

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

    // Fonction pour envoyer les invitations
    const handleSendInvitations = async () => {
        if (invitations.length === 0) {
            setAlertMessage('Aucun participant à inviter');
            setAlertType('warning');
            setShowAlert(true);
            return;
        }

        setIsSubmitting(true);
        closeSendInvitationModal();

        try {
            // Naviguer vers la page d'envoi d'invitations
            navigateTo(`/Plan/annual/sendInvitation`, {
                query: {
                    trainingId: trainingId,
                    groupId: groupData?.id,
                }
            });

            // Recharger les invitations après l'envoi (cela pourrait changer le statut)
            await fetchInvitations();
        } finally {
            setIsSubmitting(false);
        }
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

    if (initialUsersLoading) {
        return <div>Chargement des utilisateurs...</div>;
    }

    if (initialUsersError) {
        return <div>Erreur lors du chargement des données.</div>;
    }

    return (
        <form className=''>
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
                        value={formData.targetAudience}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <InputField
                        type='number'
                        label="Éffectif"
                        name="staff"
                        value={formData.staff}
                        onChange={handleInputChange}
                    />
                    {staffError && <p className="text-red text-sm">{staffError}</p>}
                    <div className="grid lg:grid-cols-2 grid-cols-1 gap-5 mt-5">
                        <InputField
                            type='number'
                            label="Manager"
                            name="managerCount"
                            value={formData.managerCount}
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Employé"
                            name="employeeCount"
                            value={formData.employeeCount}
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Ouvrier"
                            name="workerCount"
                            value={formData.workerCount}
                            onChange={handleInputChange}
                        />
                        <InputField
                            type='number'
                            label="Temporaire"
                            name="temporaryWorkerCount"
                            value={formData.temporaryWorkerCount}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>

            {/* Premier tableau - Sélectionner les participants */}
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

            {/* Deuxième tableau - Invitations */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Participants invités</h3>
                {invitationsError && (
                    <div className="text-red-600 mb-4">{invitationsError}</div>
                )}
                <Table
                    data={paginatedInvitationsData}
                    keys={TABLE_KEYS_2}
                    headers={TABLE_HEADERS_2}
                    sortableCols={sortableColumnsInvitations}
                    onSort={(column, order) => handleSortDataInvitations(column, order, handleSort)}
                    isPagination={false}
                    pagination={{
                        currentPage: currentPageInvitations,
                        totalPages: totalPagesInvitations,
                        onPageChange: setCurrentPageInvitations,
                    }}
                    totalRecords={totalRecordsInvitations}
                    loading={isLoadingInvitations}
                    visibleColumns={visibleColumnsInvitations}
                    renderers={renderers2}
                />
                <div className="text-right text-xs md:text-sm lg:text-base mt-2">
                    <button
                        type="button"
                        className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={openSendInvitationModal}
                        disabled={invitations.length === 0 || isSubmitting}
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

            {/* Modal de confirmation */}
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
                ]}
                icon={""}>
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