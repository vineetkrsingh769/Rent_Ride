import { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "@/lib/api-client";
const AuthContext = createContext(null);
function toAuthUser(u) {
  return {
    id: u._id ?? u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    agencyName: u.agencyName
  };
}
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchCurrentUser().then((u) => setUser(u ? toAuthUser(u) : null)).finally(() => setLoading(false));
  }, []);
  const login = async (email, password) => {
    const result = await loginUser(email, password);
    if ("error" in result) return { error: result.error ?? "Request failed" };
    const authUser = toAuthUser(result.data.user);
    setUser(authUser);
    return { error: null, role: authUser.role };
  };
  const register = async (data) => {
    const result = await registerUser(data);
    if ("error" in result) return { error: result.error ?? "Request failed" };
    if (result.data.pendingApproval) {
      return { error: null, pendingApproval: true, role: result.data.user.role };
    }
    setUser(toAuthUser(result.data.user));
    return { error: null, role: result.data.user.role };
  };
  const logout = async () => {
    await logoutUser();
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>;
}
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
export {
  AuthProvider,
  useAuth
};
