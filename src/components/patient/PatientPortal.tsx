import React, { useState } from 'react';
import { Appointment, HealthcareProfessional, Patient, ServiceCategory, WaitlistEntry } from '../../types';
import { RulesEngine } from '../../services/rulesEngine';
import { MyAppointments } from './MyAppointments';
import { FamilyMembersManager } from './FamilyMembersManager';
import { WaitlistManager } from './WaitlistManager';
import { BookAppointmentModal } from './BookAppointmentModal';
import { ReminderSimulatorModal } from './ReminderSimulatorModal';
import { PatientAuthModal } from './PatientAuthModal';
import { HomeView } from './HomeView';
import { ConfirmationTicketView } from './ConfirmationTicketView';
import { AlertTriangle, Phone } from 'lucide-react';

interface PatientPortalProps {
  currentPatient: Patient;
  appointments: Appointment[];
  professionals: HealthcareProfessional[];
  waitlist: WaitlistEntry[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDataUpdated: () => void;
  patients: Patient[];
  onPatientChange: (patientId: string) => void;
  initialBookingStep?: 1 | 2 | 3 | 4;
  initialBookingServiceId?: ServiceCategory;
  directAction?: 'cancel' | 'reschedule' | null;
  isBookingOpen?: boolean;
  onSetIsBookingOpen?: (open: boolean) => void;
  isAuthOpen?: boolean;
  onSetIsAuthOpen?: (open: boolean) => void;
  authInitialMode?: 'login' | 'register';
  latestConfirmedAppointment?: Appointment | null;
  onSetLatestConfirmedAppointment?: (apt: Appointment | null) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  currentPatient,
  appointments,
  professionals,
  waitlist,
  activeTab,
  onTabChange,
  onDataUpdated,
  patients,
  onPatientChange,
  initialBookingStep = 1,
  initialBookingServiceId,
  directAction,
  isBookingOpen: externalIsBookingOpen,
  onSetIsBookingOpen,
  isAuthOpen: externalIsAuthOpen,
  onSetIsAuthOpen,
  authInitialMode = 'login',
  latestConfirmedAppointment,
  onSetLatestConfirmedAppointment,
}) => {
  const [internalBookingOpen, setInternalBookingOpen] = useState(false);
  const [internalAuthOpen, setInternalAuthOpen] = useState(false);

  const isBookingOpen = externalIsBookingOpen !== undefined ? externalIsBookingOpen : internalBookingOpen;
  const isAuthOpen = externalIsAuthOpen !== undefined ? externalIsAuthOpen : internalAuthOpen;

  const setIsBookingOpen = (open: boolean) => {
    if (onSetIsBookingOpen) onSetIsBookingOpen(open);
    else setInternalBookingOpen(open);
  };

  const setIsAuthOpen = (open: boolean) => {
    if (onSetIsAuthOpen) onSetIsAuthOpen(open);
    else setInternalAuthOpen(open);
  };

  const [selectedReminderApt, setSelectedReminderApt] = useState<Appointment | null>(null);

  const suspensionCheck = RulesEngine.isPatientSuspended(currentPatient);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Subpage Header for Mis Citas, Familiares, Recordatorios, etc. */}
      {activeTab !== 'inicio' && activeTab !== 'servicios' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#244A86] border border-blue-200/60 flex items-center justify-center font-bold text-lg">
                {currentPatient.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {currentPatient.fullName}
                  </h1>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    DUI: {currentPatient.documentId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Tel: {currentPatient.phone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentPatient.familyMembers.length} familiares vinculados</span>
                  {currentPatient.email && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{currentPatient.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cambiar de Paciente / Registro
              </button>
              <button
                onClick={() => setIsBookingOpen(true)}
                disabled={!suspensionCheck.allowed}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-xs ${
                  !suspensionCheck.allowed
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#244A86] hover:bg-[#1B3664]'
                }`}
              >
                + Reservar Cita
              </button>
            </div>
          </div>

          {/* Suspension Alert (RN-04) */}
          {!suspensionCheck.allowed && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-amber-950">
                <h4 className="font-bold text-sm text-amber-950">Tu agendamiento en línea está suspendido</h4>
                <p className="mt-1 leading-relaxed">
                  Has acumulado 3 inasistencias en los últimos 6 meses. Por política parroquial, debes comunicarte con recepción para justificar tus ausencias. El personal de recepción puede atenderte, agendar tu cita y reactivar tu cuenta en el sistema.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <a
                    href="tel:22578900"
                    className="inline-flex items-center gap-1.5 bg-[#244A86] text-white px-3.5 py-1.5 rounded-lg font-semibold hover:bg-[#1B3664] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Llamar a Recepción (2257-8900)
                  </a>
                  <span className="text-amber-800 font-medium">WhatsApp: 7845-1234</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Active Tab View */}
      {(activeTab === 'inicio' || activeTab === 'servicios') && (
        <HomeView
          currentPatient={currentPatient}
          onNavigateToBooking={() => setIsBookingOpen(true)}
          onNavigateToMyAppointments={() => onTabChange('mis_citas')}
          onNavigateToReminders={() => onTabChange('recordatorios')}
          onNavigateToFamily={() => onTabChange('familiares')}
          isSuspended={!suspensionCheck.allowed}
        />
      )}

      {activeTab === 'confirmacion' && (
        (() => {
          const ticketApt =
            latestConfirmedAppointment ||
            appointments.find(
              (a) => a.patientId === currentPatient.id && (a.status === 'programada' || a.status === 'confirmada')
            ) ||
            appointments[0];

          return ticketApt ? (
            <ConfirmationTicketView
              appointment={ticketApt}
              onGoToMyAppointments={() => onTabChange('mis_citas')}
              onGoToHome={() => onTabChange('inicio')}
              onOpenReminderModal={() => setSelectedReminderApt(ticketApt)}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
              <p className="text-slate-600 text-sm">No hay un comprobante de cita reciente para mostrar.</p>
              <button
                onClick={() => onTabChange('inicio')}
                className="px-4 py-2 bg-[#244A86] hover:bg-[#1B3664] text-white text-xs font-bold rounded-xl transition-colors"
              >
                Volver a Pantalla de Inicio
              </button>
            </div>
          );
        })()
      )}

      {activeTab === 'mis_citas' && (
        <MyAppointments
          currentPatient={currentPatient}
          appointments={appointments}
          professionals={professionals}
          onAppointmentUpdated={onDataUpdated}
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenReminderModal={(apt) => setSelectedReminderApt(apt)}
          directAction={directAction}
        />
      )}

      {activeTab === 'familiares' && (
        <FamilyMembersManager
          currentPatient={currentPatient}
          onPatientUpdated={onDataUpdated}
          onBookForMember={() => setIsBookingOpen(true)}
        />
      )}

      {activeTab === 'espera' && (
        <WaitlistManager
          currentPatient={currentPatient}
          waitlist={waitlist}
          onWaitlistUpdated={onDataUpdated}
          onAppointmentBooked={() => onDataUpdated()}
        />
      )}

      {activeTab === 'recordatorios' && (
        <div className="space-y-4">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Recordatorios de Citas Parroquiales</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulación de recordatorios enviados 24 horas y 2 horas antes a través de mensajería (WhatsApp y SMS).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments
              .filter((a) => a.patientId === currentPatient.id && (a.status === 'programada' || a.status === 'confirmada'))
              .map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#244A86]">{apt.code}</span>
                    <span className="text-slate-500">{apt.serviceName}</span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <p><strong>Fecha/Hora:</strong> {apt.date} · {apt.time}</p>
                    <p><strong>Profesional:</strong> {apt.professionalName}</p>
                    <p><strong>Edificio:</strong> {apt.building} ({apt.room})</p>
                  </div>
                  <button
                    onClick={() => setSelectedReminderApt(apt)}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#244A86] font-semibold text-xs rounded-xl transition-colors"
                  >
                    Simular Aviso de WhatsApp (24h y 2h)
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookAppointmentModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        currentPatient={currentPatient}
        appointments={appointments}
        professionals={professionals}
        initialStep={initialBookingStep}
        initialServiceId={initialBookingServiceId || 'medicina_general'}
        onAppointmentBooked={(newApt) => {
          onDataUpdated();
          if (onSetLatestConfirmedAppointment) {
            onSetLatestConfirmedAppointment(newApt);
          }
          setIsBookingOpen(false);
          onTabChange('confirmacion');
        }}
        onJoinWaitlist={() => {
          onDataUpdated();
          onTabChange('espera');
        }}
      />

      {/* Reminder Simulator Modal */}
      <ReminderSimulatorModal
        isOpen={!!selectedReminderApt}
        onClose={() => setSelectedReminderApt(null)}
        appointment={selectedReminderApt}
        onReminderActionComplete={onDataUpdated}
      />

      {/* Auth / Switch Patient Modal */}
      <PatientAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        patients={patients}
        initialMode={authInitialMode}
        onLoginSuccess={(id) => onPatientChange(id)}
        onPatientCreated={() => onDataUpdated()}
      />
    </div>
  );
};
