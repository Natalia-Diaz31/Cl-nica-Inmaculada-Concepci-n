import React, { useEffect, useState } from 'react';
import { Appointment, FigmaScreenId, HealthcareProfessional, Patient, Role, WaitlistEntry } from './types';
import { ClinicStorage } from './services/storage';
import { RulesEngine } from './services/rulesEngine';
import { Navbar } from './components/common/Navbar';
import { RoleSwitcher } from './components/common/RoleSwitcher';
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

  // State
  const [currentRole, setCurrentRole] = useState<Role>('paciente');
  const [currentPatientId, setCurrentPatientId] = useState<string>('pat-1');
  const [currentProfessionalId, setCurrentProfessionalId] = useState<string>('prof-1');

  // Navigation tab state (defaults to 'inicio' P01)
  const [activeTab, setActiveTab] = useState<string>('inicio');
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

  // Sync / Refresh helper
  const refreshData = () => {
    setAppointments(ClinicStorage.getAppointments());
    setPatients(ClinicStorage.getPatients());
    setProfessionals(ClinicStorage.getProfessionals());
    setWaitlist(ClinicStorage.getWaitlist());
  };

  // Tab change with screen indicator update
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setDirectAction(null);
    if (tab === 'inicio') setActiveScreenId('P01');
    else if (tab === 'servicios') setActiveScreenId('P03');
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

  // Handle Role change
  const handleRoleChange = (newRole: Role) => {
    setCurrentRole(newRole);
    setDirectAction(null);
    setIsPatientBookingOpen(false);
    setIsAssistedBookingOpen(false);
    if (newRole === 'paciente') {
      setActiveTab('inicio');
      setActiveScreenId('P01');
    } else if (newRole === 'recepcion') {
      setActiveTab('agenda');
      setActiveScreenId('P10');
    } else if (newRole === 'profesional') {
      setActiveTab('citas_doctor');
      setActiveScreenId('P14');
    } else if (newRole === 'admin') {
      setActiveTab('reportes_ocupacion');
      setActiveScreenId('P17');
    }
    showToast('info', `Cambiado a modo ${newRole.toUpperCase()}`, 'Puedes explorar todos los flujos e interacciones correspondientes.');
  };

  // Direct 1-click jump to any Figma screen (P01-P17)
  const handleNavigateScreen = (screenId: FigmaScreenId) => {
    setActiveScreenId(screenId);
    switch (screenId) {
      case 'P01': // Inicio
        setCurrentRole('paciente');
        setActiveTab('inicio');
        setIsPatientBookingOpen(false);
        setIsAuthOpen(false);
        setDirectAction(null);
        break;
      case 'P02': // Registro
        setCurrentRole('paciente');
        setAuthInitialMode('register');
        setIsAuthOpen(true);
        setIsPatientBookingOpen(false);
        break;
      case 'P03': // Servicios (Paso 1 del Agendamiento)
        setCurrentRole('paciente');
        setActiveTab('servicios');
        setBookingStep(1);
        setIsPatientBookingOpen(true);
        setIsAuthOpen(false);
        break;
      case 'P04': // Calendario (Paso 2/3 del Agendamiento)
        setCurrentRole('paciente');
        setActiveTab('servicios');
        setBookingStep(2);
        setIsPatientBookingOpen(true);
        setIsAuthOpen(false);
        break;
      case 'P05': // Confirmar (Paso 4 del Agendamiento)
        setCurrentRole('paciente');
        setActiveTab('servicios');
        setBookingStep(4);
        setIsPatientBookingOpen(true);
        setIsAuthOpen(false);
        break;
      case 'P06': // Confirmación (Comprobante / Ticket)
        setCurrentRole('paciente');
        setIsPatientBookingOpen(false);
        setIsAuthOpen(false);
        setActiveTab('confirmacion');
        break;
      case 'P07': // Mis citas
        setCurrentRole('paciente');
        setIsPatientBookingOpen(false);
        setIsAuthOpen(false);
        setDirectAction(null);
        setActiveTab('mis_citas');
        break;
      case 'P08': // Cancelar
        setCurrentRole('paciente');
        setIsPatientBookingOpen(false);
        setIsAuthOpen(false);
        setActiveTab('mis_citas');
        setDirectAction('cancel');
        break;
      case 'P09': // Reprogramar
        setCurrentRole('paciente');
        setIsPatientBookingOpen(false);
        setIsAuthOpen(false);
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
        setIsPatientBookingOpen(false);
        setIsAuthOpen(false);
        setActiveTab('recordatorios');
        break;
      case 'P16': // Lista de espera
        setCurrentRole('paciente');
        setIsPatientBookingOpen(false);
        setIsAuthOpen(false);
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
    showToast('success', 'Datos de prueba restablecidos', 'Se han restaurado los pacientes, profesionales y citas iniciales.');
  };

  // Current logged in / simulated entities
  const currentPatient = patients.find((p) => p.id === currentPatientId) || patients[0];
  const currentProfessional = professionals.find((p) => p.id === currentProfessionalId) || professionals[0];

  const suspensionCheck = currentPatient ? RulesEngine.isPatientSuspended(currentPatient) : { allowed: true };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800">
      {/* 1. Quick Demo Switcher Bar */}
      <RoleSwitcher
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
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
      />

      {/* 2. Top Navigation Bar (Top Bar Contract) */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenBookingModal={() => {
          if (currentRole === 'paciente') {
            setBookingStep(1);
            setIsPatientBookingOpen(true);
          } else if (currentRole === 'recepcion') {
            setIsAssistedBookingOpen(true);
          }
        }}
        onOpenAuthModal={() => {
          setAuthInitialMode('login');
          setIsAuthOpen(true);
        }}
        patientName={currentPatient?.fullName}
        isSuspended={!suspensionCheck.allowed}
      />

      {/* 3. Main Workspace Router */}
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

      {/* 5. Toast Feedback Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
