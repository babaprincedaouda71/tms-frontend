import React, {useEffect, useState} from "react";
import SearchFilterAddBar from "@/components/SearchFilterAddBar";
import useSWR from "swr";
import {ValidatedNeedToAddToPlanProps} from "@/types/dataTypes";
import {NEED_TO_ADD_TO_PLAN_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";
import useTable from "@/hooks/useTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import {UserRole} from "@/contexts/AuthContext";
import {useRouter} from "next/router";
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";

// Configuration du tableau avec la colonne de sélection
const ADD_THEME_TO_PLAN_TABLE_HEADERS = ["Théme", "Source", "Sélection"];
const ADD_THEME_TO_PLAN_TABLE_KEYS = ["theme", "source", "selection"];
const ADD_THEME_TO_PLAN_RECORDS_PER_PAGE = 10;

const AddThemePage = () => {
    const {navigateTo} = useRoleBasedNavigation();
    const {exercice, planId} = useRouter().query

    // Récupération des besoins validés
    const {
        data: validNeeds,
        error: fetchingError,
        isLoading: ValidNeedsLoading
    } = useSWR<ValidatedNeedToAddToPlanProps[]>(NEED_TO_ADD_TO_PLAN_URLS.mutate, fetcher)

    // État pour garder les besoins sélectionnés
    const [needs, setNeeds] = useState<ValidatedNeedToAddToPlanProps[]>([])

    // État pour les IDs des besoins sélectionnés
    const [selectedNeedIds, setSelectedNeedIds] = useState<Set<string | number>>(new Set())

    useEffect(() => {
        if (validNeeds) {
            setNeeds(validNeeds)
        }
    }, [validNeeds])

    // hook du tableau
    const {
        currentPage: currentPageNeeds,
        visibleColumns: visibleColumnsNeeds,
        setCurrentPage: setCurrentPageNeeds,
        handleSortData: handleSortDataNeeds,
        totalPages: totalPagesNeeds,
        totalRecords: totalRecordsNeeds,
        paginatedData: paginatedNeedsData,
        sortableColumns: sortableColumnsNeeds,
    } = useTable(
        needs,
        ADD_THEME_TO_PLAN_TABLE_HEADERS,
        ADD_THEME_TO_PLAN_TABLE_KEYS,
        ADD_THEME_TO_PLAN_RECORDS_PER_PAGE,
    )

    // Fonction pour gérer la sélection/désélection d'un besoin
    const handleNeedSelection = (needId: string | number, isChecked: boolean) => {
        setSelectedNeedIds(prev => {
            const newSet = new Set(prev)
            if (isChecked) {
                newSet.add(needId)
            } else {
                newSet.delete(needId)
            }
            return newSet
        })
    }

    // Fonction pour gérer la sélection/désélection de tous les besoins
    const handleSelectAll = (isChecked: boolean) => {
        if (isChecked) {
            // Sélectionner tous les besoins visibles
            const allIds = paginatedNeedsData.map(need => need.id)
            setSelectedNeedIds(new Set(allIds))
        } else {
            // Désélectionner tous
            setSelectedNeedIds(new Set())
        }
    }

    // Fonction pour soumettre les données
    const handleSubmission = async () => {
        if (selectedNeedIds.size === 0) {
            console.warn("Aucun besoin sélectionné")
            return
        }

        // Préparer les données à envoyer
        const dataToSubmit = {
            planId: planId, // ID du plan
            selectedNeedIds: Array.from(selectedNeedIds) // Convertir Set en Array
        }

        try {
            console.log("Données à envoyer:", dataToSubmit)

            // Remplacez cette partie par votre appel API réel
            const response = await fetch(NEED_TO_ADD_TO_PLAN_URLS.addTheme, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSubmit)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "Erreur lors de l'ajout des besoins")
            }

            // Réinitialiser les sélections après soumission
            setSelectedNeedIds(new Set())
            navigateTo(`/Plan/annual/${exercice}`, {
                query: {
                    planId: planId,
                }
            })

        } catch (error) {
            console.error("Erreur lors de la soumission:", error)
            alert("Erreur lors de l'ajout des besoins")
        }
    }

    // Vérifier si tous les besoins visibles sont sélectionnés
    const areAllVisibleSelected = paginatedNeedsData.length > 0 &&
        paginatedNeedsData.every(need => selectedNeedIds.has(need.id))

    // Vérifier si certains besoins sont sélectionnés (pour l'état indéterminé)
    const areSomeSelected = paginatedNeedsData.some(need => selectedNeedIds.has(need.id))

    // Renderers UNIQUEMENT pour les cellules du tableau (pas l'en-tête)
    const renderers = {
        source: (source: string) => (
            <div
                className="text-xs md:text-sm lg:text-base"
            >
                {
                    source === "Strategic_Axes" ?
                        "Axes Stratégiques" : source === "Evaluation" ?
                            "Évaluation" : source === "Internal_Catalog" ?
                                "Catalogue Interne" : source === "External_Catalog" ?
                                    "Catalogue Externe" : source === "Individual_Requests" ?
                                        "Requêtes individuelles" : "Inconnue"
                }
            </div>
        ),
        selection: (_: string, row: ValidatedNeedToAddToPlanProps) => (
            <div className="flex justify-center items-center">
                <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    aria-label={`Sélectionner ${row.theme}`}
                    checked={selectedNeedIds.has(row.id)}
                    onChange={(e) => handleNeedSelection(row.id, e.target.checked)}
                />
            </div>
        ),
    };

    // Composant personnalisé pour l'en-tête avec case "Tout sélectionner"
    const CustomTableHead = () => {
        return (
            <thead className="text-white font-tHead text-xs md:text-sm lg:text-base">
            <tr className="font-bold text-lightBlack text-center">
                {ADD_THEME_TO_PLAN_TABLE_HEADERS.filter(h => visibleColumnsNeeds.includes(h)).map((header, index, filteredHeaders) => (
                    <th
                        key={header}
                        scope="row"
                        className={`pb-[18px] px-6 pt-[30px] font-[600] bg-gradient-to-b from-[#5051C3] to-[#9178F1] ${
                            index === 0 ? "rounded-tl-lg" : ""
                        } ${index === filteredHeaders.length - 1 ? "rounded-tr-lg" : ""}`}
                    >
                        <div className="flex justify-center items-center h-full">
                            {header === "Sélection" ? (
                                // Case "Tout sélectionner" uniquement pour la colonne Sélection
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 accent-primary"
                                    checked={areAllVisibleSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = areSomeSelected && !areAllVisibleSelected
                                    }}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    aria-label="Sélectionner tout"
                                />
                            ) : (
                                header
                            )}
                        </div>
                    </th>
                ))}
            </tr>
            </thead>
        );
    };

    return (
        <ProtectedRoute requiredRole={UserRole.Admin}>
            <div className="flex flex-col h-screen bg-backColor">
                <div className="flex items-start gap-2 md:gap-8 pt-4">
                    <SearchFilterAddBar
                        isLeftButtonVisible={false}
                        isFiltersVisible={false}
                        isRightButtonVisible={false}
                        leftTextButton="Filtrer les colonnes"
                        rightTextButton="Ajouter des thèmes"
                        filters={[]}
                        placeholderText={"Recherche de besoins"}
                    />
                </div>

                {/* Tableau personnalisé avec en-tête custom */}
                <div className="mt-10">
                    <div className="relative bg-white">
                        <div className="flex justify-center mx-auto rounded-b-[16px] px-3 bg-white overflow-x-auto">
                            <div className="gap-y-2 md:gap-y-10 relative w-full overflow-initial">
                                <table className="w-full min-w-full text-sm text-center text-gray-500">
                                    {/* En-tête personnalisé */}
                                    <CustomTableHead/>

                                    {/* Corps du tableau */}
                                    {!ValidNeedsLoading ? (
                                        <tbody className="text-xs md:text-sm lg:text-base">
                                        {!paginatedNeedsData.length ? (
                                            <tr>
                                                <td colSpan={ADD_THEME_TO_PLAN_TABLE_KEYS.filter((key, index) => visibleColumnsNeeds.includes(ADD_THEME_TO_PLAN_TABLE_HEADERS[index])).length}>
                                                    <div className="w-full h-[250px] flex justify-center items-center">
                                                        <p className="text-gray">Aucun résultat trouvé</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedNeedsData.map((item, idx) => {
                                                const isEven = idx % 2 === 0;
                                                const baseBackgroundColor = isEven ? "bg-[#F7F7FF]" : "bg-white";
                                                const visibleKeys = ADD_THEME_TO_PLAN_TABLE_KEYS.filter((key, index) =>
                                                    visibleColumnsNeeds.includes(ADD_THEME_TO_PLAN_TABLE_HEADERS[index])
                                                );

                                                return (
                                                    <tr key={idx}
                                                        className={`${baseBackgroundColor} font-title font-medium`}>
                                                        {visibleKeys.map((key) => (
                                                            <td
                                                                key={key}
                                                                scope="row"
                                                                className="py-[28px] px-6 justify-center items-center text-center"
                                                            >
                                                                {renderers && renderers[key]
                                                                    ? renderers[key](item[key], item)
                                                                    : item[key]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })
                                        )}
                                        </tbody>
                                    ) : (
                                        <tbody>
                                        <tr>
                                            <td colSpan={ADD_THEME_TO_PLAN_TABLE_KEYS.filter((key, index) => visibleColumnsNeeds.includes(ADD_THEME_TO_PLAN_TABLE_HEADERS[index])).length}>
                                                <div className="animate-pulse space-y-4 p-4">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                        </tbody>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Section : Bouton d'action */}
                    <div className="text-right text-xs md:text-sm lg:text-base mt-2">
                        <button
                            type="button"
                            className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            onClick={handleSubmission}
                            disabled={selectedNeedIds.size === 0}
                        >
                            Ajouter à la liste ({selectedNeedIds.size})
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}

export default AddThemePage