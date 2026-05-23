import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LoginSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isGoogleSuccess = params.get("google") === "success";

    if (isGoogleSuccess) {
      navigate("/");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return <p>Đang xử lý đăng nhập...</p>;
}

export default LoginSuccess;
