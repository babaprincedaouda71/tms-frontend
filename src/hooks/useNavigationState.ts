import { useState, useCallback, useEffect } from 'react';
import { NAVIGATION_CONSTANTS } from '../constants/navigation';
import { NavigationState } from '@/types/dataTypes';

const STORAGE_KEY = 'navigationState';

export const useNavigationState = (initialTab?: string) => {
    // Initialiser l'état avec les valeurs du localStorage ou les valeurs par défaut
    const [state, setState] = useState<NavigationState>(() => {
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem(STORAGE_KEY);
            const parsedState = savedState ? JSON.parse(savedState) : null;

            // Si on a un onglet initial depuis l'URL, l'utiliser en priorité
            if (initialTab) {
                return {
                    activeTab: initialTab,
                    activeSubItem: null
                };
            }

            // Sinon utiliser l'état sauvegardé ou la valeur par défaut
            return parsedState || {
                activeTab: NAVIGATION_CONSTANTS.DEFAULT_TAB,
                activeSubItem: null
            };
        }
        return {
            activeTab: initialTab || NAVIGATION_CONSTANTS.DEFAULT_TAB,
            activeSubItem: null
        };
    });

    // Sauvegarder l'état dans le localStorage à chaque changement
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state]);

    const setActiveTab = useCallback((tabId: string) => {
        setState(prev => ({
            ...prev,
            activeTab: tabId,
            activeSubItem: null
        }));
    }, []);

    const setActiveSubItem = useCallback((mainTabId: string, subItemId: string) => {
        setState({
            activeTab: mainTabId,
            activeSubItem: subItemId
        });
    }, []);

    return { state, setActiveTab, setActiveSubItem };
};