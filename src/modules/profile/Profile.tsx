import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Perfil</h1>
            <p>{user?.displayName}</p>
            <p>{user?.email}</p>
            <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
    );
}