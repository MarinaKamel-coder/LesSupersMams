import React, {useMemo, useState} from "react";
import {login, register} from "../services/login.api";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "../style/auth.css";
 
type Mode = "login" | "register";
 
type FormState = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;    
};
 
type FieldErrors = Partial<Record<keyof FormState, string>>;
 
function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());    
}
 
export default function AuthPage() {
    const {setAuth} = useAuth();
 
    const navigate = useNavigate();
    const [mode, setMode] = useState<Mode>("login");
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string>("");
 
    const [form, setForm] = useState<FormState>({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
    });
 
    const [errors, setErrors] = useState<FieldErrors>({});
 
    const title = useMemo(() => (mode === "login" ? "Connextion": "Inscription"), [mode]);
 
    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({...prev, [key]: value}));
        setErrors((prev) => ({...prev, [key]: undefined}));
        setGlobalError("");
    }
 
    function Validate(): FieldErrors {
        const e: FieldErrors = {};
        if (!isValidEmail(form.email)) e.email = "Email invalide.";
        if (form.password.trim().length < 8) e.password = "Mot de passe: Minimum 8 caracteres.";
 
        if (mode === "register") {
            if (form.confirmPassword !== form.password) e.confirmPassword = "Les mots de passe ne correspondent pas.";            
            if (!form.firstName.trim()) e.firstName = "Prenom requis.";
            if (!form.lastName.trim()) e.lastName = "Nom requis";
        }
        return e;
    }
 
 
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setGlobalError("");
 
        const e2 = Validate();
        setErrors(e2);
        if (Object.values(e2).some(Boolean)) return;
 
        setLoading(true);
        try {
            const res =
                mode === "login"
                  ? await login({email: form.email.trim(), password: form.password})
                  : await register({
                    email: form.email.trim(),
                    password: form.password,
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                  });
       
        setAuth(res.token, res.user);
 
        // Redirection (React Router)
        navigate("/", {replace: true});
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Une erreur est survenue.";
            setGlobalError(message);
        } finally {
            setLoading(false);
        }
    }
 
    function switchMode(next: Mode) {
        setMode(next);
        setErrors({});
        setGlobalError("");
        // garder email, reset confirm si login
        setForm((prev) => ({
            ...prev,
            confirmPassword: next === "login" ? "": prev.confirmPassword,
        }));
    }
 
    return (
        <div className="Login-Page">
          <div className="Login-card">
            <div className="Login-header">
              <div>
                <h1>GreenCommute</h1>
                <p className="subtile">Plateforme de covoiturage ecologique</p>
              </div>
 
              <div className="login-tabs" role="tablist" aria-label="Autentification">
                <button
                  type="button"
                  className={mode === "login" ? "tab active" : "tab"}
                  onClick={() => switchMode("login")}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  className={mode === "register" ? "tab active" : "tab"}
                  onClick={() => switchMode("register")}
                >
                  S'inscrire  
                </button>
              </div>
            </div>
 
            <form className="login-form" onSubmit={onSubmit}>
              <h2>{title}</h2>
 
              {globalError ? <div className="global-error">{globalError}</div> : null}  
 
              {mode === "register" && (
                <div className="grid-2">
                  <div className="field">
                    <label>Prenom</label>
                    <input
                      value={form.firstName}
                      onChange={(e) => setField("firstName", e.target.value)}
                      autoComplete="given-name"
                    />
                    {errors.firstName ? <small className="error">{errors.firstName}</small> : null}  
                  </div>
 
                  <div className="field">  
                    <label>Nom</label>
                    <input
                      value={form.lastName}
                      onChange={(e) => setField("lastName", e.target.value)}
                      autoComplete="family-name"
                    />
                    {errors.lastName ? <small className="errors">{errors.lastName}</small> : null}
                  </div>
                </div>
              )}
 
              <div className="field">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
                {errors.email ? <small className="error">{errors.email}</small> : null}
              </div>
 
              <div className="field">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                {errors.password ? <small className="errir">{errors.password}</small> : null}
              </div>
 
              {mode === "register" && (
                <div className="field">
                  <label>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setField("confirmPassword", e.target.value)}
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword ? <small className="error">{errors.confirmPassword}</small> : null}
                </div>  
              )}  
 
              <button className="Primary" type="submit" disabled={loading}>
                {loading ? "Chargement..." : mode === "login" ? "Connexion" : "Creer mon compte"}
              </button>
 
              {mode === "login" ? (
                <div className="helper-row">
                  <a href="/forgot-password">Mot de passe oublie ?</a>
                </div>
              ) : (
                <p className="helper-text">
                  En vous inscrivant, vous contribuez a reduire les emissions en partageant vos trajets.
                </p>
              )}                
            </form>
          </div>
        </div>
      );
    }  
 