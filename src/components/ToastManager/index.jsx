import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const showToast = ({ type = "info", message, duration = 3000 }) => {
    toast(message, {
        type,
        autoClose: duration,
        pauseOnHover: true,
        hideProgressBar: false,
        position: "top-right",
        theme: "colored",
    });
};
