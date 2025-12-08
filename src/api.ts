import axios from "axios";

const api = axios.create({
    baseURL: "http://192.168.1.3:8000/api",
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        localStorage.setItem("token", token);
    } else {
        delete api.defaults.headers.common["Authorization"];
        localStorage.removeItem("token");
    }
}

const saved = localStorage.getItem("token");
if (saved) setAuthToken(saved);


export default api;