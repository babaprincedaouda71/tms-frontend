// src/components/Forms/Switch.tsx
import React from 'react';

interface SwitchProps {
    label: string;
    name: string;
    checked: boolean;
    onChange?: (checked: boolean) => void;
    planifieField?: React.ReactNode;
    className?: string;
    error?: string;
}

const Switch = ({label, name, checked, onChange, planifieField, className, error}: SwitchProps) => (
    <div className={`flex items-center w-full text-xs md:text-sm lg:text-base ${className}`}>
        <label className="flex-[1] block font-medium text-gray-700 break-words">
            {label}
        </label>
        <div className="flex-[4] flex items-center gap-4">
            <div className="w-[48px]"> {/* Largeur fixe pour maintenir l'alignement */}
                <button
                    role="switch"
                    aria-checked={checked}
                    type="button"
                    name={name}
                    onClick={() => onChange(!checked)}
                    className={`
            relative inline-flex h-8 w-[52px] items-center rounded-full
            ${checked ? 'bg-gradient-to-b from-gradientBlueStart to-gradientBlueEnd' : 'bg-inputBgColor border-gray-500 border-2'}
            transition-colors duration-200 ease-in-out focus:outline-none
          `}
                >
          <span
              className={`
              inline-block transform rounded-full transition-transform duration-200 ease-in-out
              ${checked ? 'translate-x-6 h-6 w-6 bg-white' : 'translate-x-1 h-4 w-4 bg-gray-500'}
            `}
          />
                </button>
            </div>
            {planifieField && (
                <div className="flex-1">
                    {planifieField}
                </div>
            )}
            {error && (
                <p className="mt-1 text-sm text-red">
                    {error}
                </p>
            )}
        </div>
    </div>
);

export default Switch;