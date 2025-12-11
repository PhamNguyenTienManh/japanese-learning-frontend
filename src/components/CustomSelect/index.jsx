import { useState, useRef, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./CustomSelect.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function CustomSelect({ options, value, onChange, label }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={cx("wrapper")} ref={wrapperRef}>
            {label && <label className={cx("label")}>{label}</label>}

            <div
                className={cx("select-box")}
                onClick={() => setOpen(!open)}
            >
                <span>{selected?.label || "Chọn"}</span>
                <FontAwesomeIcon icon={faChevronDown} />
            </div>

            {open && (
                <div className={cx("dropdown")}>
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={cx("item", { active: opt.value === value })}
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CustomSelect;
