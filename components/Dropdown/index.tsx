import React, { useEffect, useRef, useState } from "react";

import styles from "./Dropdown.module.scss";
import DownArrowIcon from "@/public/assets/icons/down-arrow.svg";

export type OptionType = {
    icon: string | undefined;
    name: string;
};

type DropdownProps = {
    options: OptionType[];
    selected: OptionType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (option: any) => void;
    disabled?: boolean
};

const Dropdown: React.FC<DropdownProps> = ({ options, selected, onChange, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOptionClick = (option: any) => {
        setIsOpen(false);
        onChange(option);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={`${styles.select} ${disabled ? styles.disabled : ""}`} ref={dropdownRef}>
            <div
                className={styles.selectHeader}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selected ? (
                    <div className={styles.selectHeaderSelected}>
                        {selected.icon && <img
                            src={selected.icon}
                            alt={selected.name}
                            className={styles.selectIcon}
                        />}
                        <span>{selected.name}</span>
                    </div>
                ) : (
                    <span className={styles.selectPlaceholder}>Dropdown an option</span>
                )}
                <span className={`${styles.selectArrow} ${isOpen ? styles.open : ""}`}>
                    <DownArrowIcon />
                </span>
            </div>
            <div className={`${styles.selectDropdown}  ${isOpen ? styles.open : ""}`}>
                {options.map((option, index) => {
                    if (option == selected) return undefined;
                    else
                        return (<div
                            key={index}
                            className={styles.selectOption}
                            onClick={() => handleOptionClick(option)}
                        >
                            {option.icon && <img
                                src={option.icon}
                                alt={option.name}
                                className={styles.selectOptionIcon}
                            />}
                            <span>{option.name}</span>
                        </div>)
                })}
            </div>
        </div>
    );
};

export default Dropdown;
