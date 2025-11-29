import { json } from "react-router-dom";

function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    jsonPayload = JSON.parse(jsonPayload);
    const isExpired = jsonPayload?.exp ? jsonPayload.exp * 1000 < Date.now() : false;

    if (isExpired) {
      localStorage.removeItem("token");
      return null;
    }
    
    return jsonPayload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

export default decodeToken;