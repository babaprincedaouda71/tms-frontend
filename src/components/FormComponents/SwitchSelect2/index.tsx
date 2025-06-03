import React, { useState, useRef, useEffect } from "react";

interface Participant {
    id: string;
    name: string;
    checked: boolean;
}

export interface SwitchOption {
    id: string;
    label: string;
    checked: boolean;
    hasSubOptions?: boolean;
    subOptions?: Participant[];
}

interface SwitchSelectProps {
    name?: string;
    options: SwitchOption[];
    onChange: (options: SwitchOption[]) => void;
    className?: string;
    label?: string;
    labelClassName?: string;
}

const ChevronIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const SwitchSelect: React.FC<SwitchSelectProps> = ({
    name,
    options,
    onChange,
    className,
    label,
    labelClassName,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localOptions, setLocalOptions] = useState<SwitchOption[]>(options);
    const [openSubOptionId, setOpenSubOptionId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getDisplayText = () => {
        const selectedOptions = localOptions.flatMap(opt => {
            if (opt.hasSubOptions && opt.subOptions) {
                if (opt.checked) {
                    return [opt.label];
                }
                return opt.subOptions.filter(subOpt => subOpt.checked).map(subOpt => subOpt.name);
            }
            return opt.checked ? [opt.label] : [];
        });

        if (selectedOptions.length === 0) return "Sélectionner";
        if (selectedOptions.length <= 2) {
            return selectedOptions.join(", ");
        }
        return `${selectedOptions[0]}, ${selectedOptions[1]}, ...`;
    };

    const handleSwitchChange = (optionId: string, checked: boolean, participantId?: string) => {
        const newOptions = localOptions.map(opt => {
            if (opt.id === optionId) {
                if (opt.hasSubOptions && opt.subOptions) {
                    if (participantId) {
                        // Gestion du changement d'un participant individuel
                        const newSubOptions = opt.subOptions.map(subOpt =>
                            subOpt.id === participantId ? { ...subOpt, checked } : subOpt
                        );
                        const allChecked = newSubOptions.every(subOpt => subOpt.checked);
                        return {
                            ...opt,
                            checked: allChecked,
                            subOptions: newSubOptions
                        };
                    } else {
                        // Gestion du changement de "Tous les participants"
                        return {
                            ...opt,
                            checked,
                            subOptions: opt.subOptions.map(subOpt => ({
                                ...subOpt,
                                checked
                            }))
                        };
                    }
                }
                return { ...opt, checked };
            }
            return opt;
        });

        setLocalOptions(newOptions);
        onChange(newOptions);
    };

    const toggleSubOptions = (optionId: string) => {
        setOpenSubOptionId(openSubOptionId === optionId ? null : optionId);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setOpenSubOptionId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            className={`flex items-center text-formInputTextColor font-semibold text-xs md:text-sm lg:text-base w-full ${className}`}
            ref={dropdownRef}
        >
            {label && (
                <label htmlFor={name} className={`flex-[1] block break-words ${labelClassName}`}>
                    {label}
                </label>
            )}
            <div className="flex-[4] relative">
                <button
                    type="button"
                    className="relative flex items-center justify-between w-full h-12 bg-inputBgColor rounded-md px-4"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="absolute left-1/2 -translate-x-1/2">
                        {getDisplayText()}
                    </span>
                    <span
                        className={`absolute right-5 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""
                            }`}
                    >
                        <ChevronIcon />
                    </span>
                </button>

                {isOpen && (
                    <div className="absolute w-full mt-1 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden z-50">
                        {localOptions.map((option) => (
                            <div key={option.id} className="relative group">
                                <div
                                    className={`
                                        flex items-center justify-center w-full px-5 py-3 cursor-pointer
                                        hover:bg-primary hover:bg-opacity-5
                                        group-hover:before:content-['']
                                        group-hover:before:absolute
                                        group-hover:before:left-0
                                        group-hover:before:top-0
                                        group-hover:before:h-full
                                        group-hover:before:w-1
                                        group-hover:before:bg-violet-600
                                    `}
                                >
                                    <div className="flex items-center justify-center w-full">
                                        <div
                                            className="flex-[2] flex items-center gap-2 font-medium text-gray-700 break-words cursor-pointer"
                                            onClick={() => option.hasSubOptions && toggleSubOptions(option.id)}
                                        >
                                            {option.label}
                                            {option.hasSubOptions && (
                                                <span className={`transition-transform duration-200 ${openSubOptionId === option.id ? "transform rotate-180" : ""
                                                    }`}>
                                                    <ChevronIcon />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-[2] flex items-center justify-end gap-4">
                                            <div className="w-[48px]">
                                                <button
                                                    role="switch"
                                                    aria-checked={option.checked}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSwitchChange(option.id, !option.checked);
                                                    }}
                                                    className={`
                                                        relative inline-flex h-8 w-[52px] items-center rounded-full
                                                        ${option.checked
                                                            ? 'bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd'
                                                            : 'bg-inputBgColor border-gray-500 border-2'
                                                        }
                                                        transition-colors duration-200 ease-in-out focus:outline-none
                                                    `}
                                                >
                                                    <span
                                                        className={`
                                                            inline-block transform rounded-full transition-transform duration-200 ease-in-out
                                                            ${option.checked
                                                                ? 'translate-x-6 h-6 w-6 bg-white'
                                                                : 'translate-x-1 h-4 w-4 bg-gray-500'
                                                            }
                                                        `}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {option.hasSubOptions && openSubOptionId === option.id && option.subOptions && (
                                    <div className="border-t border-gray-100 px-24">
                                        {option.subOptions.map((participant) => (
                                            <div key={participant.id} className="relative group">
                                                <div
                                                    className={`
                                                        flex items-center justify-center w-full px-5 py-3 cursor-pointer
                                                        hover:bg-primary hover:bg-opacity-5 bg-gray-50
                                                        group-hover:before:content-['']
                                                        group-hover:before:absolute
                                                        group-hover:before:left-0
                                                        group-hover:before:top-0
                                                        group-hover:before:h-full
                                                        group-hover:before:w-1
                                                        group-hover:before:bg-violet-600
                                                    `}
                                                >
                                                    <div className="flex items-center justify-center w-full">
                                                        <label className="flex-[4] block font-medium text-gray-700 break-words">
                                                            {participant.name}
                                                        </label>
                                                        <div className="flex-[1] flex items-center justify-end gap-4">
                                                            <div className="w-[48px]">
                                                                <button
                                                                    role="switch"
                                                                    aria-checked={participant.checked}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSwitchChange(option.id, !participant.checked, participant.id);
                                                                    }}
                                                                    className={`
                                                                        relative inline-flex h-8 w-[52px] items-center rounded-full
                                                                        ${participant.checked
                                                                            ? 'bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd'
                                                                            : 'bg-inputBgColor border border-gray-500 border-2'
                                                                        }
                                                                        transition-colors duration-200 ease-in-out focus:outline-none
                                                                    `}
                                                                >
                                                                    <span
                                                                        className={`
                                                                            inline-block transform rounded-full transition-transform duration-200 ease-in-out
                                                                            ${participant.checked
                                                                                ? 'translate-x-6 h-6 w-6 bg-white'
                                                                                : 'translate-x-1 h-4 w-4 bg-gray-500'
                                                                            }
                                                                        `}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SwitchSelect;