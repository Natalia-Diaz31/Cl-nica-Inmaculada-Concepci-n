import React, { useEffect, useState } from 'react';
import { Appointment, FigmaScreenId, HealthcareProfessional, Patient, Role, WaitlistEntry, ServiceCategory } from './types';
import { ClinicStorage } from './services/storage';
import { RulesEngine } from './services/rulesEngine';
import { Navbar } from './components/common/Navbar';
import { RoleSwitcher, DeviceViewMode } from './components/common/RoleSwitcher';
import { InitialRoleSelection } from './components/common/InitialRoleSelection';
import { PatientLoginView } from './components/patient/PatientLoginView';
import { Footer } from './components/common/Footer';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { PatientPortal } from './components/patient/PatientPortal';
import { ReceptionPortal } from './components/reception/ReceptionPortal';
import { ProfessionalPortal } from './components/professional/ProfessionalPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { Wifi, Battery } from 'lucide-react';

export default function App() {
  // Initialize storage defaults if empty
  useEffect(() => {
    ClinicStorage.initDefaults();
  }, []);

  // MANDATORY FIRST SCREEN: Role starts as null!
  // App opens ALWAYS with the Welcome Role Selection Screen (Figma structure)
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [patientAuthenticated, setPatientAuthenticated] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<DeviceViewMode>('desktop');

  // Active entity identifiers
  const [currentPatientId, setCurrentPatientId] = useState<string>('pat-1');
  const [currentProfessionalId, setCurrentProfessionalId] = useState<string>('prof-1');

  // Navigation tab state (defaults to 'servicios' P03 once in patient role)
  const [activeTab, setActiveTab] = useState<string>('servicios');
  const [activeScreenId, setActiveScreenId] = useState<FigmaScreenId>('P01');

  // Modals & Navigation triggers
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [directAction, setDirectAction] = useState<'cancel' | 'reschedule' | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [latestConfirmedAppointment, setLatestConfirmedAppointment] = useState<Appointment | null>(null);

  // Entities
  const [appointments, setAppointments] = useState<Appointment[]>(() => ClinicStorage.getAppointments());
  const [patients, setPatients] = useState<Patient[]>(() => ClinicStorage.getPatients());
  const [professionals, setProfessionals] = useState<HealthcareProfessional[]>(() => ClinicStorage.getProfessionals());
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => ClinicStorage.getWaitlist());

  // Global modals
  const [isPatientBookingOpen, setIsPatientBookingOpen] = useState(false);
  const [isAssistedBookingOpen, setIsAssistedBookingOpen] = useState(false);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync helper
  const refreshData = () => {
    setAppointments(ClinicStorage.getAppointments());
    setPatients(ClinicStorage.getPatients());
    setProfessionals(ClinicStorage.getProfessionals());
    setWaitlist(ClinicStorage.getWaitlist());
  };

  // Exit back to Initial Role Selection Screen
  const handleExitToInitialScreen = () => {
    setCurrentRole(null);
    setPatientAuthenticated(false);
    setIsPatientBookingOpen(false);
    setIsAssistedBookingOpen(false);
    setActiveScreenId('P01');
    showToast('info', 'Selección de Rol', 'Has regresado a la pantalla inicial.');
  };

  // Role Selection from Initial Screen
  const handleSelectRole = (role: Role) => {
    setCurrentRole(role);
    setDirectAction(null);
    setIsPatientBookingOpen(false);
    setIsAssistedBookingOpen(false);

    if (role === 'paciente') {
      // Patient must log in with DUI or create account
      setPatientAuthenticated(false);
      setActiveTab('inicio');
      setActiveScreenId('P02');
    } else if (role === 'recepcion') {
      setActiveTab('agenda');
      setActiveScreenId('P10');
      showToast('info', 'Acceso a Recepción', 'Bienvenida Carmen Menjívar · Ventanilla y Agenda');
    } else if (role === 'profesional') {
      setActiveTab('citas_doctor');
      setActiveScreenId('P14');
      const prof = professionals.find((p) => p.id === currentProfessionalId);
      showToast('info', 'Acceso a Profesional de Salud', prof ? `${prof.name} · ${prof.serviceName}` : undefined);
    } else if (role === 'admin') {
      setActiveTab('reportes_ocupacion');
      setActiveScreenId('P17');
      showToast('info', 'Acceso Administrativo', 'Dirección Médica y Reportes Institucionales');
    }
  };

  // Patient Login Success
  const handlePatientLoginSuccess = (patientId: string) => {
    setCurrentPatientId(patientId);
    setPatientAuthenticated(true);
    setActiveTab('inicio');
    setActiveScreenId('P03');
    const pat = patients.find((p) => p.id === patientId);
    showToast('success', 'Sesión iniciada', pat ? `Bienvenido/a, ${pat.fullName}` : 'Bienvenido/a a Mi Cita Parroquial');
  };

  // New Patient Registered
  const handlePatientCreated = (newPatient: Patient) => {
    refreshData();
    setCurrentPatientId(newPatient.id);
    setPatientAuthenticated(true);
    setActiveTab('inicio');
    setActiveScreenId('P03');
    showToast('success', 'Cuenta creada exitosamente', `Bienvenido/a, ${newPatient.fullName}`);
  };

  // Tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setDirectAction(null);
    if (tab === 'servicios' || tab === 'inicio') setActiveScreenId('P03');
    else if (tab === 'mis_citas') setActiveScreenId('P07');
    else if (tab === 'confirmacion') setActiveScreenId('P06');
    else if (tab === 'recordatorios') setActiveScreenId('P15');
    else if (tab === 'espera') setActiveScreenId('P16');
    else if (tab === 'agenda') setActiveScreenId('P10');
    else if (tab === 'citas_doctor') setActiveScreenId('P14');
    else if (tab === 'horarios_doctor') setActiveScreenId('P12');
    else if (tab === 'bloqueos_doctor') setActiveScreenId('P13');
    else if (tab === 'reportes_ocupacion' || tab === 'reportes_inasistencias') setActiveScreenId('P17');
  };

  // Demo mode 1-click jump to any Figma screen (P01-P17)
  const handleNavigateScreen = (screenId: FigmaScreenId) => {
    setActiveScreenId(screenId);
    switch (screenId) {
      case 'P01': // Initial Role Screen
        setCurrentRole(null);
        setPatientAuthenticated(false);
        break;
      case 'P02': // Patient Registration / Login
        setCurrentRole('paciente');
        setPatientAuthenticated(false);
        break;
      case 'P03': // Servicios (Paso 1 del Agendamiento)
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setActiveTab('servicios');
        setBookingStep(1);
        setIsPatientBookingOpen(true);
        break;
      case 'P04': // Calendario (Paso 2/3 del Agendamiento)
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setActiveTab('servicios');
        setBookingStep(2);
        setIsPatientBookingOpen(true);
        break;
      case 'P05': // Confirmar (Paso 4 del Agendamiento)
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setActiveTab('servicios');
        setBookingStep(4);
        setIsPatientBookingOpen(true);
        break;
      case 'P06': // Confirmación (Comprobante / Ticket)
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setIsPatientBookingOpen(false);
        setActiveTab('confirmacion');
        break;
      case 'P07': // Mis citas
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setIsPatientBookingOpen(false);
        setDirectAction(null);
        setActiveTab('mis_citas');
        break;
      case 'P08': // Cancelar
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setIsPatientBookingOpen(false);
        setActiveTab('mis_citas');
        setDirectAction('cancel');
        break;
      case 'P09': // Reprogramar
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setIsPatientBookingOpen(false);
        setActiveTab('mis_citas');
        setDirectAction('reschedule');
        break;
      case 'P10': // Agenda recepción
        setCurrentRole('recepcion');
        setActiveTab('agenda');
        setIsAssistedBookingOpen(false);
        break;
      case 'P11': // Agendar por paciente (Recepción asistida)
        setCurrentRole('recepcion');
        setActiveTab('agenda');
        setIsAssistedBookingOpen(true);
        break;
      case 'P12': // Mi horario (Profesional)
        setCurrentRole('profesional');
        setActiveTab('horarios_doctor');
        break;
      case 'P13': // Bloquear fechas (Profesional)
        setCurrentRole('profesional');
        setActiveTab('bloqueos_doctor');
        break;
      case 'P14': // Citas profesional (Agenda privada)
        setCurrentRole('profesional');
        setActiveTab('citas_doctor');
        break;
      case 'P15': // Notificaciones
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setIsPatientBookingOpen(false);
        setActiveTab('recordatorios');
        break;
      case 'P16': // Lista de espera
        setCurrentRole('paciente');
        setPatientAuthenticated(true);
        setIsPatientBookingOpen(false);
        setActiveTab('espera');
        break;
      case 'P17': // Reportes (Admin)
        setCurrentRole('admin');
        setActiveTab('reportes_ocupacion');
        break;
      default:
        break;
    }
  };

  // Reset demo fixtures
  const handleResetData = () => {
    ClinicStorage.resetAll();
    refreshData();
    setCurrentPatientId('pat-1');
    setCurrentProfessionalId('prof-1');
    showToast('success', 'Datos restablecidos', 'Se han restaurado los datos y citas de demostración iniciales.');
  };

  // Current logged in / simulated entities
  const currentPatient = patients.find((p) => p.id === currentPatientId) || patients[0];
  const currentProfessional = professionals.find((p) => p.id === currentProfessionalId) || professionals[0];
  const suspensionCheck = currentPatient ? RulesEngine.isPatientSuspended(currentPatient) : { allowed: true };

  // Render Core Functional Workspace based on Role
  const renderWorkspace = () => {
    // 1. MANDATORY INITIAL ROLE SELECTION SCREEN
    if (currentRole === null) {
      return (
        <div className="flex-1 flex flex-col justify-center">
          <InitialRoleSelection onSelectRole={handleSelectRole} />
        </div>
      );
    }

    // 2. PATIENT AUTHENTICATION STEP
    if (currentRole === 'paciente' && !patientAuthenticated) {
      return (
        <div className="flex-1 flex flex-col justify-center">
          <PatientLoginView
            onBackToRoleSelection={handleExitToInitialScreen}
            onLoginSuccess={handlePatientLoginSuccess}
            onPatientCreated={handlePatientCreated}
            patients={patients}
          />
        </div>
      );
    }

    // 3. AUTHENTICATED PORTALS WITH FIGMA FIDELITY
    return (
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <Navbar
          currentRole={currentRole}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onExitRole={handleExitToInitialScreen}
          onOpenBookingModal={() => {
            if (currentRole === 'paciente') {
              setBookingStep(1);
              setIsPatientBookingOpen(true);
            } else if (currentRole === 'recepcion') {
              setIsAssistedBookingOpen(true);
            }
          }}
          patientName={currentPatient?.fullName}
          isSuspended={!suspensionCheck.allowed}
        />

        {/* Role Portal Main Views */}
        <main className="flex-1">
          {currentRole === 'paciente' && currentPatient && (
            <PatientPortal
              currentPatient={currentPatient}
              appointments={appointments}
              professionals={professionals}
              waitlist={waitlist}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onDataUpdated={() => {
                refreshData();
                showToast('success', 'Operación completada', 'Se actualizó tu información de citas.');
              }}
              patients={patients}
              onPatientChange={(id) => setCurrentPatientId(id)}
              initialBookingStep={bookingStep}
              directAction={directAction}
              isBookingOpen={isPatientBookingOpen}
              onSetIsBookingOpen={setIsPatientBookingOpen}
              isAuthOpen={isAuthOpen}
              onSetIsAuthOpen={setIsAuthOpen}
              authInitialMode={authInitialMode}
              latestConfirmedAppointment={latestConfirmedAppointment}
              onSetLatestConfirmedAppointment={setLatestConfirmedAppointment}
            />
          )}

          {currentRole === 'recepcion' && (
            <ReceptionPortal
              appointments={appointments}
              professionals={professionals}
              patients={patients}
              waitlist={waitlist}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onDataUpdated={() => {
                refreshData();
                showToast('success', 'Agenda actualizada', 'Se registraron los cambios en el sistema parroquial.');
              }}
              isAssistedBookingOpen={isAssistedBookingOpen}
              setIsAssistedBookingOpen={setIsAssistedBookingOpen}
            />
          )}

          {currentRole === 'profesional' && currentProfessional && (
            <ProfessionalPortal
              currentProfessional={currentProfessional}
              appointments={appointments}
              patients={patients}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onDataUpdated={() => {
                refreshData();
                showToast('success', 'Agenda médica guardada', 'Los cambios en horarios o atenciones se han aplicado.');
              }}
              professionals={professionals}
              onProfessionalChange={(id) => setCurrentProfessionalId(id)}
            />
          )}

          {currentRole === 'admin' && (
            <AdminPortal
              appointments={appointments}
              professionals={professionals}
              patients={patients}
              activeTab={activeTab}
            />
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Quick Device & Role Controller Bar (Sticky Top) */}
      <RoleSwitcher
        currentRole={currentRole}
        onRoleChange={handleSelectRole}
        onExitToInitialScreen={handleExitToInitialScreen}
        patients={patients}
        currentPatientId={currentPatientId}
        onPatientChange={(id) => {
          setCurrentPatientId(id);
          const p = patients.find((pat) => pat.id === id);
          if (p) {
            showToast('info', `Simulando paciente: ${p.fullName}`, p.isSuspended ? 'Este paciente tiene el agendamiento suspendido' : undefined);
          }
        }}
        professionals={professionals}
        currentProfessionalId={currentProfessionalId}
        onProfessionalChange={(id) => {
          setCurrentProfessionalId(id);
          const prof = professionals.find((pr) => pr.id === id);
          if (prof) {
            showToast('info', `Simulando profesional: ${prof.name}`, prof.serviceName);
          }
        }}
        onResetData={handleResetData}
        activeScreenId={activeScreenId}
        onNavigateScreen={handleNavigateScreen}
        deviceMode={deviceMode}
        onToggleDeviceMode={setDeviceMode}
      />

      {/* 2. Responsive View Adaptation: Computadora / Tablet / Teléfono */}
      {deviceMode === 'desktop' && (
        <div className="flex-1 flex flex-col w-full bg-slate-50">
          {renderWorkspace()}
        </div>
      )}

      {deviceMode === 'tablet' && (
        <div className="flex-1 py-6 px-4 flex flex-col items-center justify-start overflow-y-auto bg-slate-900/90">
          <div className="text-center mb-3 text-slate-300 text-xs">
            <span className="font-bold text-white">Vista Tablet (768 px)</span>
            <span className="text-slate-400 block text-[11px]">Diseño intermedio para interacción táctil cómoda</span>
          </div>

          {/* 768px Tablet Frame */}
          <div className="w-[768px] max-w-full min-h-[880px] rounded-[36px] border-[10px] border-slate-900 bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-slate-800 my-2">
            {/* Tablet Status Header */}
            <div className="bg-[#244A86] text-white text-[11px] font-semibold px-6 py-2 flex items-center justify-between select-none shrink-0 border-b border-blue-900/40">
              <span className="font-bold">Clínica Inmaculada Concepción</span>
              <div className="flex items-center gap-2 text-white/90">
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4" />
              </div>
            </div>

            {/* Tablet Content */}
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
              {renderWorkspace()}
            </div>
          </div>
        </div>
      )}

      {deviceMode === 'mobile' && (
        <div className="flex-1 py-6 px-4 flex flex-col items-center justify-start overflow-y-auto bg-slate-900/90">
          <div className="text-center mb-3 text-slate-300 text-xs">
            <span className="font-bold text-white">Vista Celular Figma (390 px)</span>
            <span className="text-slate-400 block text-[11px]">Diseño vertical fiel al prototipo móvil de la Clínica</span>
          </div>

          {/* 390px Mobile Phone Frame */}
          <div className="w-[390px] max-w-full min-h-[820px] rounded-[48px] border-[10px] border-slate-900 bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-slate-800 my-2">
            {/* iOS Dynamic Island & Status Bar */}
            <div className="bg-[#244A86] text-white text-[12px] font-semibold px-5 pt-3 pb-1.5 flex items-center justify-between select-none shrink-0 border-b border-blue-900/40">
              <span>9:41</span>
              <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-2"></div>
              </div>
              <div className="flex items-center gap-1.5 text-white/90">
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4" />
              </div>
            </div>

            {/* Mobile Scrollable Container */}
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
              {renderWorkspace()}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="bg-slate-100 py-1.5 flex justify-center items-center shrink-0 border-t border-slate-200">
              <div className="w-28 h-1 bg-slate-400 rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Toast Feedback Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
