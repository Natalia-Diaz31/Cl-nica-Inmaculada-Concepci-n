import React, { useState } from 'react';
import { Patient } from '../../types';
import { ClinicStorage } from '../../services/storage';
import { Modal } from '../common/Modal';
import { User, Phone, FileText, Mail, CheckCircle, AlertCircle, LogIn, UserPlus } from 'lucide-react';

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onLoginSuccess: (patientId: string) => void;
  onPatientCreated: (newPatient: Patient) => void;
  initialMode?: 'login' | 'register';
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({
  isOpen,
  onClose,
  patients,
  onLoginSuccess,
  onPatientCreated,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Login state
  const [loginDoc, setLoginDoc] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register state (HU-01, HU-15)
  const [fullName, setFullName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginDoc.trim()) {
      setLoginError('Por favor ingresa tu documento (DUI).');
      return;
    }

    const patient = ClinicStorage.getPatientByDocument(loginDoc.trim());
    if (patient) {
      onLoginSuccess(patient.id);
      onClose();
    } else {
      setLoginError('No se encontró cuenta con este documento. Verifica el número o regístrate en un paso.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    // Required field validation (HU-01 Criterio verificable)
    if (!fullName.trim()) {
      setRegisterError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!documentId.trim()) {
      setRegisterError('Por favor ingresa tu documento de identidad.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setRegisterError('Ingresa tu teléfono (mínimo 8 dígitos).');
      return;
    }

    // Check if document already exists (HU-01 Escenario 2)
    const existing = ClinicStorage.getPatientByDocument(documentId.trim());
    if (existing) {
      setRegisterError('Ya existe una cuenta con este documento. Puedes iniciar sesión directamente.');
      return;
    }

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      fullName: fullName.trim(),
      documentId: documentId.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      isSuspended: false,
      unexcusedAbsencesCount: 0,
      absenceHistory: [],
      familyMembers: [],
      createdAt: new Date().toISOString(),
    };

    ClinicStorage.savePatient(newPatient);
    onPatientCreated(newPatient);
    onLoginSuccess(newPatient.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Iniciar Sesión Paciente' : 'Registro de Paciente'}
      subtitle={mode === 'login' ? 'Ingresa con tu documento de identidad (DUI)' : 'Registro ágil con DUI y teléfono. Correo opcional'}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Mode Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-[#244A86] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ya tengo cuenta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegisterError(null);
            }}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-[#244A86] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registrarme (Nuevo)
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-dui-input" className="block font-semibold text-slate-700 mb-1">
                Documento de Identidad (DUI) *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="login-dui-input"
                  type="text"
                  required
                  value={loginDoc}
                  onChange={(e) => setLoginDoc(e.target.value)}
                  placeholder="02458912-3"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ejemplos de prueba: <strong>02458912-3</strong> (Juan Pérez) o <strong>01928374-9</strong> (Carlos Romero - suspendido)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#244A86] hover:bg-[#1B3664] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar a Mi Portal</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {registerError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span>{registerError}</span>
                  {registerError.includes('Ya existe') && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginDoc(documentId);
                        setMode('login');
                      }}
                      className="block mt-1 text-[#244A86] underline font-semibold"
                    >
                      Iniciar sesión con este documento
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="reg-fullname-input" className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="reg-fullname-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Carmen Lorena Menjívar"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-doc-input" className="block font-semibold text-slate-700 mb-1">DUI / Documento *</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="reg-doc-input"
                    type="text"
                    required
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="01234567-8"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-phone-input" className="block font-semibold text-slate-700 mb-1">Teléfono (8 dígitos) *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="reg-phone-input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="7845-1234"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="reg-email-input" className="block font-semibold text-slate-700 mb-1">
                Correo Electrónico <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="reg-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@correo.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#244A86]"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Puedes registrarte y agendar sin ingresar correo electrónico.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta y Continuar</span>
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
