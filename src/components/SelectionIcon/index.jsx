import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function SelectionIcon({ selection, onClick }) {
    if (!selection) return null;

    const style = {
        position: "absolute",
        top: selection.rect.top - 35,
        left: selection.rect.right + 5,
        zIndex: 999999,
        cursor: "pointer",
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "50%",
        padding: "6px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(selection.text);
    };

    return (
        <div style={style} onMouseDown={handleMouseDown}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
        </div>
    );
}