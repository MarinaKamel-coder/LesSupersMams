import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { login, register } from "../services/login.api";
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

export default function LoginPage() {
  const { setAuth, token } = useAuth();
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

  useEffect(() => {
    if (token) navigate("/dashboard", { replace: true });
  }, [token, navigate]);

  const title = useMemo(
    () => (mode === "login" ? "Connexion" : "Inscription"),
    [mode]
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setGlobalError("");
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!isValidEmail(form.email)) next.email = "Email invalide.";
    if (form.password.trim().length < 8)
      next.password = "Mot de passe: minimum 8 caractères.";

    if (mode === "register") {
      if (!form.firstName.trim()) next.firstName = "Prénom requis.";
      if (!form.lastName.trim()) next.lastName = "Nom requis.";
      if (form.confirmPassword !== form.password)
        next.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    return next;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError("");

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await login({
              email: form.email.trim(),
              password: form.password,
            })
          : await register({
              email: form.email.trim(),
              password: form.password,
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
            });

      setAuth(res.token, res.user);
      navigate("/dashboard", { replace: true });
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
    setForm((prev) => ({
      ...prev,
      confirmPassword: next === "login" ? "" : prev.confirmPassword,
    }));
  }

  return (
    <div className="Login-Page">
      <div className="AuthShell">
        <div className="AuthHero">
          <div className="AuthBadge" aria-hidden>
            <span className="AuthBadgeIcon">🚗</span>
            <span className="AuthBadgeIcon">🌿</span>
          </div>
          <h1 className="AuthTitle">Bienvenue sur GreenCommute</h1>
          <p className="AuthSubtitle">
            Partagez vos trajets et réduisez votre empreinte carbone
          </p>
        </div>

        <div className="Login-card">
          <div className="login-tabs" role="tablist" aria-label="Authentification">
            <button
              type="button"
              className={mode === "login" ? "tab active" : "tab"}
              onClick={() => switchMode("login")}
              disabled={loading}
            >
              Connexion
            </button>
            <button
              type="button"
              className={mode === "register" ? "tab active" : "tab"}
              onClick={() => switchMode("register")}
              disabled={loading}
            >
              Inscription
            </button>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
          <h2>{title}</h2>

          {globalError ? (
            <div className="global-error" role="alert">
              {globalError}
            </div>
          ) : null}

          {mode === "register" && (
            <div className="grid-2">
              <div className="field">
                <label htmlFor="firstName">Prénom</label>
                <input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  autoComplete="given-name"
                  disabled={loading}
                />
                {errors.firstName ? (
                  <small className="error">{errors.firstName}</small>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="lastName">Nom</label>
                <input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  autoComplete="family-name"
                  disabled={loading}
                />
                {errors.lastName ? (
                  <small className="error">{errors.lastName}</small>
                ) : null}
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              autoComplete="email"
              inputMode="email"
              disabled={loading}
            />
            {errors.email ? <small className="error">{errors.email}</small> : null}
          </div>

          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              disabled={loading}
            />
            {errors.password ? (
              <small className="error">{errors.password}</small>
            ) : null}
          </div>

          {mode === "register" && (
            <div className="field">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
              {errors.confirmPassword ? (
                <small className="error">{errors.confirmPassword}</small>
              ) : null}
            </div>
          )}

          <button className="Primary" type="submit" disabled={loading}>
            {loading
              ? "Chargement..."
              : mode === "login"
                ? "Connexion"
                : "Créer mon compte"}
          </button>

          {mode === "register" ? (
            <p className="helper-text">
              En vous inscrivant, vous contribuez à réduire les émissions en partageant vos
              trajets.
            </p>
          ) : null}
        </form>
        </div>

        <div className="AuthCallout" role="note">
          <span className="AuthCalloutIcon" aria-hidden>
            🌿
          </span>
          <p className="AuthCalloutText">
            En vous inscrivant, vous rejoignez une communauté engagée pour réduire les
            émissions de CO₂.
          </p>
        </div>
      </div>
    </div>
  );
}
