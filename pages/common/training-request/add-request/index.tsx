import React, {ChangeEvent, useMemo, useState} from "react";
import useSWR from "swr";
import {DepartmentProps, DomainProps, SiteProps} from "@/types/dataTypes";
import {DEPARTMENT_URLS, DOMAIN_URLS, MY_REQUESTS_URLS, SITE_URLS} from "@/config/urls";
import {fetcher} from "@/services/api";
import CustomSelect from "@/components/FormComponents/CustomSelect";
import InputField from "@/components/FormComponents/InputField";
import TextAreaField from "@/components/FormComponents/TextAreaField";
import {useRoleBasedNavigation} from "@/hooks/useRoleBasedNavigation";
import {useAuth, UserRole} from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

interface FormData {
    theme: string;
    year: number | null;
    domain: number | null;
    wishDate: string;
    site: number | null;
    department: number | null;
    learningMode: string;
    objective: string;
}

const AddRequestComponent: React.FC = () => {
    const {user} = useAuth()
    if (user) {
        console.log(user)
    }
    const {navigateTo} = useRoleBasedNavigation()
    const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'destination', string>>>({});
    const [formData, setFormData] = useState<FormData>({
        theme: "",
        year: new Date().getFullYear(),
        domain: null,
        wishDate: "",
        site: null,
        department: null,
        learningMode: "",
        objective: "",
    });

    const {data: sitesData} = useSWR<SiteProps[]>(SITE_URLS.mutate, fetcher);
    const {data: domainsData} = useSWR<DomainProps[]>(DOMAIN_URLS.mutate, fetcher);
    const {data: departmentsData} = useSWR<DepartmentProps[]>(DEPARTMENT_URLS.mutate, fetcher);

    const sitesOptionsFormatted = useMemo(() => {
        if (sitesData) {
            return sitesData.map(site => ({label: site.label, id: site.id}));
        }
        return [];
    }, [sitesData]);

    const domainsOptionsFormatted = useMemo(() => {
        if (domainsData) {
            return domainsData.map(domain => ({label: domain.name, id: domain.id}));
        }
        return [];
    }, [domainsData]);

    const departmentsOptionsFormatted = useMemo(() => {
        if (departmentsData) {
            return departmentsData.map(dept => ({label: dept.name, id: dept.id}));
        }
        return [];
    }, [departmentsData]);

    const handleChangeCustomSelect = (event: { name: string; value: string }) => {
        const {name, value} = event;
        let selectedId: number | null = null;
        switch (name) {
            case "domain":
                selectedId = domainsData?.find(domain => domain.name === value)?.id || null;
                break;
            case "department":
                selectedId = departmentsData?.find(department => department.name === value)?.id || null;
                break;
            case "site":
                selectedId = sitesData.find(site => site.label === value)?.id || null;
                break;
            case "learningMethod":
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    learningMode: value,
                }));
                return; // Exit the function early since we've handled the update
            default:
                selectedId = parseInt(value, 10) || null;
                break;
        }
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: selectedId,
        }));
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        let newValue = value;
        setFormData(prev => ({...prev, [name]: newValue}));
        setErrors(prevErrors => ({...prevErrors, [name]: ""}));
    };

    const handleCancel = () => {
        navigateTo("/my-requests");
    }

    const handleSubmit = async () => {
        const siteToSend = formData.site ? sitesData?.find(site => site.id === formData.site) : null;
        const formattedSite = siteToSend ? siteToSend.label : null;

        const departmentToSend = formData.department ? departmentsData?.find(dpt => dpt.id === formData.department) : null;
        const formattedDepartment = departmentToSend ? departmentToSend.name : null;

        const domainToSend = formData.domain ? domainsData?.find(domain => domain.id === formData.domain) : null;
        const formattedDomain = domainToSend ? domainToSend.name : null;

        const requesterToSend = user
            ? {
                requesterId: user.id,
                requesterFullName: `${user.firstName} ${user.lastName}`,
                managerId: user.managerId
            }
            : null;
        const dataToSend = {
            year: formData.year,
            domain: formattedDomain,
            theme: formData.theme,
            site: formattedSite,
            department: formattedDepartment,
            wishDate: formData.wishDate,
            requester: requesterToSend,
            objective: formData.objective,
            learningMode: formData.learningMode,
        };

        console.log("Nouvelle requête à envoyer : ", dataToSend);

        try {
            const result = await fetch(MY_REQUESTS_URLS.add, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSend), // <---- ENVOIE L'OBJET FORMATÉ
            });

            if (!result.ok) {
                const errorData = await result.json();
                console.error("Erreur lors de l'envoi :", errorData);
                return;
            }

            const json = await result.json();
            console.log("Success : ", json);

            navigateTo("/my-requests");
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    return (
        <ProtectedRoute requiredRoles={[UserRole.Collaborateur, UserRole.Manager]}>
            <form className="mx-auto bg-white font-title rounded-lg pt-6 px-6 pb-14">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Créer une nouvelle demande de formation</h2>
                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 md:gap-x-16 lg:gap-x-24 mb-4">
                    <InputField
                        label="Titre de la formation"
                        name="theme"
                        value={formData.theme}
                        onChange={handleInputChange}
                        error={errors.theme}
                    />
                    <CustomSelect
                        label={"Domaine"}
                        options={domainsOptionsFormatted.map(opt => opt.label)}
                        name="domain"
                        value={domainsData?.find(d => d.id === formData.domain)?.name || ''}
                        onChange={handleChangeCustomSelect}
                        className="lg:flex-1"
                        error={errors.domain}
                    />
                    <InputField
                        label="Année"
                        name="year"
                        type="number"
                        minValue={formData.year}
                        value={formData.year}
                        onChange={handleInputChange}
                        error={errors.year}
                    />
                    <InputField
                        label="Date souhaitée"
                        name="wishDate"
                        type="date"
                        value={formData.wishDate}
                        onChange={handleInputChange}
                        error={errors.wishDate}
                    />
                    <CustomSelect
                        label={"Site"}
                        options={sitesOptionsFormatted.map(site => site.label)}
                        name="site"
                        value={sitesData?.find(s => s.id === formData.site)?.label || ''}
                        onChange={handleChangeCustomSelect}
                        className="lg:flex-1"
                        error={errors.site}
                    />
                    <CustomSelect
                        label={"Département"}
                        options={departmentsOptionsFormatted.map(opt => opt.label)}
                        name="department"
                        value={departmentsData?.find(d => d.id === formData.department)?.name || ''}
                        onChange={handleChangeCustomSelect}
                        className="lg:flex-1"
                        error={errors.department}
                    />
                    <CustomSelect
                        label={"Mode de formation"}
                        options={["Présentiel", "A distance", "Hybride"]}
                        name="learningMethod"
                        value={formData.learningMode}
                        onChange={handleChangeCustomSelect}
                        className="lg:flex-1"
                        error={errors.learningMode}
                    />
                    <TextAreaField
                        label="Description & objectif"
                        name="objective"
                        value={formData.objective}
                        onChange={handleInputChange}
                        error={errors.objective}
                    />
                </div>
                <div className="mt-5 text-right text-xs md:text-sm lg:text-base flex justify-end gap-4">
                    <button
                        onClick={handleCancel}
                        type="button"
                        className="bg-white border-2 text-primary font-bold p-2 md:p-3 lg:p-4 rounded-xl"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        type="button"
                        className="bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd hover:bg-indigo-700 text-white font-bold p-2 md:p-3 lg:p-4 rounded-xl"
                    >
                        Enregistrer
                    </button>
                </div>
            </form>
        </ProtectedRoute>
    )
}
export default AddRequestComponent;