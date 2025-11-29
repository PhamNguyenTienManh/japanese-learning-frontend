import { createContext, useContext, useState } from "react";

const GlobalModalContext = createContext(null);

export function GlobalModalProvider({ children }) {
    const [modal, setModal] = useState(null);

    const openGlobalModal = ({ title, message, confirmText, onConfirm, onCancel }) => {
        setModal({ title, message, confirmText, onConfirm, onCancel });
    };

    const closeModal = () => setModal(null);

    return (
        <GlobalModalContext.Provider value={{ openGlobalModal, closeModal }}>
            {children}
            {modal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal.title}</h3>
                            <button onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>{modal.message}</p>
                        </div>
                        <div className="modal-footer">
                            {modal.onCancel && (
                                <button onClick={() => { modal.onCancel(); closeModal(); }}>Hủy</button>
                            )}
                            <button
                                onClick={() => {
                                    modal.onConfirm?.();
                                    closeModal();
                                }}
                            >
                                {modal.confirmText || "OK"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </GlobalModalContext.Provider>
    );
}

export function useGlobalModal() {
    return useContext(GlobalModalContext);
}
