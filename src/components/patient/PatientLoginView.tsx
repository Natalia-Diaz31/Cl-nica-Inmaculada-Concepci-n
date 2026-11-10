import React, { useState } from 'react';
import { Patient } from '../../types';
import { ClinicStorage } from '../../services/storage';
import {
  User,
  ArrowLeft,
  Lock,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  LogIn,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface PatientLoginViewProps {
  onBackToRoleSelection: () => void;
  onLoginSuccess: (patientId: string) => void;
  onPatientCreated: (newPatient: Patient) => void;
  patients: Patient[];
}

export const PatientLoginView: React.FC<PatientLoginViewProps> = ({
  onBackToRoleSelection,
  onLoginSuccess,
  onPatientCreated,
  patients,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginDui, setLoginDui] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regDocumentId, setRegDocumentId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanDui = loginDui.trim();
    if (!cleanDui) {
      setLoginError('Por favor ingresa tu número de documento (DUI).');
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('Por favor ingresa tu contraseña.');
      return;
    }

    const patient = ClinicStorage.getPatientByDocument(cleanDui);
    if (patient) {
      onLoginSuccess(patient.id);
    } else {
      setLoginError('No se encontró una cuenta con este DUI. Verifica el número o crea tu cuenta.');
    }
  };

  const handleQuickDemoLogin = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setLoginDui(patient.documentId);
      setLoginPassword('clinica123');
      onLoginSuccess(patient.id);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regFullName.trim()) {
      setRegError('Por favor ingresa tu nombre completo.');
      return;
    }

    const cleanDui = regDocumentId.trim();
    if (!cleanDui) {
      setRegError('Por favor ingresa tu Documento Único de Identidad (DUI).');
      return;
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setRegError('Ingresa un número de teléfono válido (mínimo 8 dígitos).');
      return;
    }

    if (!regPassword.trim()) {
      setRegError('Por favor crea una contraseña para tu cuenta.');
      return;
    }

    // Check if DUI is already registered
    const existing = ClinicStorage.getPatientByDocument(cleanDui);
    if (existing) {
      setRegError('Ya existe una cuenta con este DUI. Por favor inicia sesión directamente.');
      return;
    }

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      fullName: regFullName.trim(),
      documentId: cleanDui,
      phone: regPhone.trim(),
      email: regEmail.trim() || undefined,
      isSuspended: false,
      unexcusedAbsencesCount: 0,
      absenceHistory: [],
      familyMembers: [],
      createdAt: new Date().toISOString(),
    };

    ClinicStorage.savePatient(newPatient);
    onPatientCreated(newPatient);
    onLoginSuccess(newPatient.id);
  };

  return (
    <div className="min-h-full py-6 sm:py-10 px-4 sm:px-6 max-w-lg mx-auto w-full">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBackToRoleSelection}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#244A86] transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a selección de rol</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[#244A86] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            ✝
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Acceso para Pacientes
          </h2>
          <p className="text-xs text-slate-500">
            Clínica Inmaculada Concepción · Mi Cita Parroquial
          </p>
        </div>

        {/* Tab Toggle: Iniciar Sesión / Crear Cuenta */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white text-[#244A86] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white text-[#244A86] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* --- FORM 1: INICIAR SESIÓN --- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-dui" className="block font-semibold text-slate-700 mb-1">
                Documento Único de Identidad (DUI) *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="login-dui"
                  type="text"
                  required
                  value={loginDui}
                  onChange={(e) => setLoginDui(e.target.value)}
                  placeholder="02345678-9"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#244A86] focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block font-semibold text-slate-700 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#244A86] focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#244A86] hover:bg-[#1B3664] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar como Paciente</span>
            </button>

            {/* Quick Demonstration Fill for Evaluators */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 block text-center">
                Cuentas de demostración rápida para evaluación:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('pat-1')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block text-xs">Juan Carlos Pérez</span>
                    <span className="text-[10px] text-slate-500 font-mono">DUI: 02345678-9 · Sin faltas</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#244A86] shrink-0">Usar cuenta →</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('pat-2')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block text-xs">María Elena Rodríguez</span>
                    <span className="text-[10px] text-slate-500 font-mono">DUI: 03456789-1 · Con familiares</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#244A86] shrink-0">Usar cuenta →</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('pat-3')}
                  className="p-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 text-left flex items-center justify-between transition-colors"
                >
                  <div className="truncate">
                    <span className="font-bold text-amber-950 block text-xs">Roberto Carlos Gómez</span>
                    <span className="text-[10px] text-amber-800 font-mono">DUI: 04567890-2 · 3 faltas (Suspendido)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-900 shrink-0">Probar caso →</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* --- FORM 2: CREAR CUENTA --- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label htmlFor="reg-name" className="block font-semibold text-slate-700 mb-1">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Ej. Ana Patricia Morales"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#244A86] focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-dui" className="block font-semibold text-slate-700 mb-1">
                Documento Único de Identidad (DUI) *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="reg-dui"
                  type="text"
                  required
                  value={regDocumentId}
                  onChange={(e) => setRegDocumentId(e.target.value)}
                  placeholder="01234567-8"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#244A86] focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block font-semibold text-slate-700 mb-1">
                Teléfono Celular * <span className="text-slate-400 font-normal">(Para recordatorios de citas)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="7890-1234"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#244A86] focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block font-semibold text-slate-700 mb-1">
                Crear Contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#244A86] focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block font-semibold text-slate-700 mb-1">
                Correo Electrónico <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-[#244A86] focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#244A86] hover:bg-[#1B3664] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 pt-2 active:scale-[0.99]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta y Continuar</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
