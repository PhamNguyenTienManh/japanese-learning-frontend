export const showToast = ({ type = "info", message, duration = 3000 }) => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent("app-toast", {
            detail: { type, message, duration },
        })
    );
};
