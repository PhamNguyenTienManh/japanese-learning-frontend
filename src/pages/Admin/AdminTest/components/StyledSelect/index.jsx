import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import styles from "./StyledSelect.module.scss";

const cx = classNames.bind(styles);

function StyledSelect({
    value,
    options,
    onChange,
    className,
    ariaLabel,
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState(null);
    const rootRef = useRef(null);
    const menuRef = useRef(null);

    const selectedOption =
        options.find((option) => option.value === value) || options[0] || null;

    useEffect(() => {
        if (!open || disabled) return undefined;

        const updateMenuPosition = () => {
            const rect = rootRef.current?.getBoundingClientRect();
            if (!rect) return;

            const viewportPadding = 12;
            const preferredMaxHeight = 320;
            const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
            const spaceAbove = rect.top - viewportPadding;
            const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
            const availableHeight = openAbove ? spaceAbove : spaceBelow;
            const maxHeight = Math.max(120, Math.min(preferredMaxHeight, availableHeight));

            setMenuStyle({
                top: openAbove
                    ? Math.max(viewportPadding, rect.top - maxHeight - 8)
                    : rect.bottom + 8,
                left: rect.left,
                width: rect.width,
                maxHeight,
            });
        };

        const handlePointerDown = (event) => {
            const clickedTrigger = rootRef.current?.contains(event.target);
            const clickedMenu = menuRef.current?.contains(event.target);

            if (!clickedTrigger && !clickedMenu) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        updateMenuPosition();
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [disabled, open]);

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setOpen(false);
    };

    return (
        <div
            ref={rootRef}
            className={cx("root", { open: open && !disabled, disabled }, className)}
        >
            <button
                type="button"
                className={cx("button")}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => {
                    if (!disabled) {
                        setOpen((current) => !current);
                    }
                }}
                disabled={disabled}
            >
                <span className={cx("label")}>{selectedOption?.label || ""}</span>
                <FontAwesomeIcon icon={faChevronDown} className={cx("icon")} />
            </button>

            {open &&
                !disabled &&
                menuStyle &&
                createPortal(
                    <div
                        ref={menuRef}
                        className={cx("menu")}
                        role="listbox"
                        aria-label={ariaLabel}
                        style={menuStyle}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={option.value === value}
                                className={cx("option", {
                                    selected: option.value === value,
                                })}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </div>
    );
}

export default StyledSelect;
