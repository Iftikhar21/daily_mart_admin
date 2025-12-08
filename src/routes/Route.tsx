import { Navigate } from "react-router-dom";

const Route = ({ children }: any) => {
    const user = localStorage.getItem("user");
    if (!user) return <Navigate to="/login" replace />;

    const parsed = JSON.parse(user);

    return parsed.role === "admin" ? children : <Navigate to="/login" replace />;
};

export default Route;
