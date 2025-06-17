// pages/manager/team-calendar/index.tsx
import React, {useMemo, useState} from 'react';
import {Calendar, ChevronLeft, ChevronRight, Clock, Eye, MapPin, Users} from 'lucide-react';
import {useAuth, UserRole} from '@/contexts/AuthContext';
import useSWR from 'swr';
import {fetcher} from '@/services/api';
import {TRAINING_INVITATION_URLS} from '@/config/urls';
import ProtectedRoute from '@/components/ProtectedRoute';

interface TeamInvitation {
    id: string;
    trainingTheme: string;
    dates?: string[];
    location?: string;
    city?: string;
    participantCount?: number;
    status: string;
    trainerName?: string;
    invitationDate: string;
    startTime?: string;
    endTime?: string;
    // Informations supplémentaires pour les managers
    teamMembers?: string[]; // Noms des membres de l'équipe invités
}

const statusColors = {
    PENDING: {bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300'},
    ACCEPTED: {bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300'},
    DECLINED: {bg: 'bg-red', text: 'text-red-800', border: 'border-red-300'},

    'En attente': {bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300'},
    'Acceptée': {bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300'},
    'Refusée': {bg: 'bg-red', text: 'text-red-800', border: 'border-red-300'}
};

const statusLabels = {
    PENDING: 'En attente',
    ACCEPTED: 'Acceptée',
    DECLINED: 'Refusée'
};

const TeamCalendarPage: React.FC = () => {
    const {user} = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedInvitation, setSelectedInvitation] = useState<TeamInvitation | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Chargement des invitations de l'équipe
    const {data: teamInvitationsData} = useSWR<TeamInvitation[]>(
        user?.id ? `${TRAINING_INVITATION_URLS.getTeamInvitations}/${user.id}` : null,
        fetcher
    );

    const teamInvitations = useMemo(() => teamInvitationsData || [], [teamInvitationsData]);

    // Générer les jours du calendrier
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay();

        const days = [];

        // Jours du mois précédent
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            days.push({date, isCurrentMonth: false});
        }

        // Jours du mois actuel
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(year, month, day);
            days.push({date, isCurrentMonth: true});
        }

        // Jours du mois suivant
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            days.push({date, isCurrentMonth: false});
        }

        return days;
    };

    // Obtenir les formations pour une date
    const getTeamTrainingsForDate = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return teamInvitations.filter(invitation =>
            invitation.dates && invitation.dates.includes(dateString)
        );
    };

    const navigateMonth = (direction: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const openModal = (invitation: TeamInvitation) => {
        setSelectedInvitation(invitation);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedInvitation(null);
        setIsModalOpen(false);
    };

    const calendarDays = generateCalendarDays();
    const today = new Date().toDateString();

    return (
        <ProtectedRoute requiredRole={UserRole.Manager}>
            <div className="bg-white rounded-lg p-6">
                {/* En-tête */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6"/>
                        Calendrier des Formations - Mon Équipe
                    </h1>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5"/>
                        </button>

                        <h2 className="text-xl font-semibold min-w-[200px] text-center">
                            {currentDate.toLocaleDateString('fr-FR', {
                                month: 'long',
                                year: 'numeric'
                            })}
                        </h2>

                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Légende */}
                <div className="flex gap-4 mb-4 text-sm">
                    {Object.entries(statusLabels).map(([status, label]) => (
                        <div key={status} className="flex items-center gap-2">
                            <div
                                className={`w-3 h-3 rounded-full ${statusColors[status].bg} ${statusColors[status].border} border`}></div>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="text-yellow-800 font-semibold">En attente</div>
                        <div className="text-2xl font-bold text-yellow-900">
                            {teamInvitations.filter(inv => inv.status === 'En attente').length}
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-green-800 font-semibold">Acceptées</div>
                        <div className="text-2xl font-bold text-green-900">
                            {teamInvitations.filter(inv => inv.status === 'Acceptée').length}
                        </div>
                    </div>
                    <div className="bg-red p-4 rounded-lg border border-red-200">
                        <div className="text-white font-semibold">Refusées</div>
                        <div className="text-2xl font-bold text-white">
                            {teamInvitations.filter(inv => inv.status === 'DECLINED').length}
                        </div>
                    </div>
                </div>

                {/* Grille calendrier */}
                <div className="grid grid-cols-7 gap-1">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                        <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50">
                            {day}
                        </div>
                    ))}

                    {calendarDays.map((day, index) => {
                        const trainings = getTeamTrainingsForDate(day.date);
                        const isToday = day.date.toDateString() === today;

                        return (
                            <div
                                key={index}
                                className={`min-h-[120px] p-2 border border-gray-200 ${
                                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                            >
                                <div className={`text-sm font-medium mb-2 ${
                                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                } ${isToday ? 'text-blue-600' : ''}`}>
                                    {day.date.getDate()}
                                </div>

                                <div className="space-y-1">
                                    {trainings.map(training => {
                                        const statusColor = statusColors[training.status] || statusColors.PENDING;
                                        return (
                                            <div
                                                key={training.id}
                                                onClick={() => openModal(training)}
                                                className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity
                          ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}
                                            >
                                                <div className="font-medium truncate">
                                                    {training.trainingTheme}
                                                </div>
                                                {training.teamMembers && training.teamMembers.length > 0 && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Users className="w-3 h-3"/>
                                                        <span>{training.teamMembers.length}</span>
                                                    </div>
                                                )}
                                                {training.startTime && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3"/>
                                                        <span>{training.startTime}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal de détails */}
                {isModalOpen && selectedInvitation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Détails de la formation - Équipe
                                    </h3>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <Eye className="w-5 h-5"/>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            {selectedInvitation.trainingTheme}
                                        </h4>
                                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium
                      ${statusColors[selectedInvitation.status]?.bg || statusColors.PENDING.bg} 
                      ${statusColors[selectedInvitation.status]?.text || statusColors.PENDING.text}
                      ${statusColors[selectedInvitation.status]?.border || statusColors.PENDING.border} border`}>
                                            {statusLabels[selectedInvitation.status] || selectedInvitation.status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedInvitation.location && selectedInvitation.city && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-500"/>
                                                <span>{selectedInvitation.location}, {selectedInvitation.city}</span>
                                            </div>
                                        )}

                                        {selectedInvitation.participantCount && (
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-500"/>
                                                <span>{selectedInvitation.participantCount} participants total</span>
                                            </div>
                                        )}

                                        {selectedInvitation.startTime && selectedInvitation.endTime && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-500"/>
                                                <span>{selectedInvitation.startTime} - {selectedInvitation.endTime}</span>
                                            </div>
                                        )}
                                    </div>

                                    {selectedInvitation.trainerName && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Formateur
                                            </label>
                                            <p className="text-gray-900">{selectedInvitation.trainerName}</p>
                                        </div>
                                    )}

                                    {selectedInvitation.dates && selectedInvitation.dates.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Dates de formation
                                            </label>
                                            <p className="text-gray-900">
                                                {selectedInvitation.dates.map(date =>
                                                    new Date(date).toLocaleDateString('fr-FR')
                                                ).join(', ')}
                                            </p>
                                        </div>
                                    )}

                                    {selectedInvitation.teamMembers && selectedInvitation.teamMembers.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Membres de l'équipe invités
                                            </label>
                                            <div className="space-y-1">
                                                {selectedInvitation.teamMembers.map((member, index) => (
                                                    <div key={index}
                                                         className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                        <Users className="w-4 h-4 text-gray-500"/>
                                                        <span className="text-gray-900">{member}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t">
                                        <button
                                            onClick={closeModal}
                                            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default TeamCalendarPage;