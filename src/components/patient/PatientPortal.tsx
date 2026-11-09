import React, { useState } from 'react';
import { Appointment, ClinicService, HealthcareProfessional, Patient, ServiceCategory, WaitlistEntry } from '../../types';
import { CLINIC_SERVICES, ClinicStorage } from '../../services/storage';
import { RulesEngine } from '../../services/rulesEngine';
import { MyAppointments } from './MyAppointments';
import { FamilyMembersManager } from './FamilyMembersManager';
import { WaitlistManager } from './WaitlistManager';
import { BookAppointmentModal } from './BookAppointmentModal';
import { ReminderSimulatorModal } from './ReminderSimulatorModal';
import { PatientAuthModal } from './PatientAuthModal';
import { HomeView } from './HomeView';
import { ConfirmationTicketView } from './ConfirmationTicketView';
import { InteractiveCalendar } from '../common/InteractiveCalendar';
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  HeartPulse,
  Activity,
  Syringe,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

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

  // Filters for availability lookup (HU-02)
  const [filterService, setFilterService] = useState<ServiceCategory>(initialBookingServiceId || 'medicina_general');
  const [filterDate, setFilterDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [filterProfId, setFilterProfId] = useState<string>('all');

  const suspensionCheck = RulesEngine.isPatientSuspended(currentPatient);

  const getServiceIcon = (id: ServiceCategory) => {
    switch (id) {
      case 'medicina_general':
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case 'medicina_interna':
        return <HeartPulse className="w-5 h-5 text-indigo-600" />;
      case 'fisioterapia':
        return <Activity className="w-5 h-5 text-teal-600" />;
      case 'enfermeria':
        return <Syringe className="w-5 h-5 text-sky-600" />;
      default:
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
    }
  };

  // Availability lookup results (HU-02)
  const lookupProf = filterProfId === 'all'
    ? professionals.filter((p) => p.serviceId === filterService)
    : professionals.filter((p) => p.id === filterProfId);

  const scheduleInfo = filterDate ? RulesEngine.getBuildingAndHoursForDate(filterDate, 'Edificio Principal') : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Patient Greeting & Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#244A86] border border-blue-200/60 flex items-center justify-center font-bold text-lg">
            {currentPatient.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Bienvenido/a, {currentPatient.fullName}
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

      {/* Active Tab View */}
      {activeTab === 'inicio' && (
        <HomeView
          currentPatient={currentPatient}
          onNavigateToBooking={(serviceId) => {
            if (serviceId) setFilterService(serviceId as ServiceCategory);
            setIsBookingOpen(true);
          }}
          onNavigateToMyAppointments={() => onTabChange('mis_citas')}
          onNavigateToWaitlist={() => onTabChange('espera')}
          onOpenAuth={() => setIsAuthOpen(true)}
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

      {activeTab === 'servicios' && (
        <div className="space-y-8">
          {/* Services Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Servicios Médicos Disponibles</h2>
              <span className="text-xs text-slate-500">4 especialidades clínicas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CLINIC_SERVICES.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {srv.imageUrl && (
                    <div className="h-28 w-full overflow-hidden relative bg-slate-100">
                      <img
                        src={srv.imageUrl}
                        alt={srv.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                      <div className="absolute bottom-2 left-3 text-white text-xs font-bold flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-[#244A86] flex items-center justify-center">
                          {getServiceIcon(srv.id)}
                        </div>
                        <span>{srv.name}</span>
                      </div>
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-slate-800">
                        ~{srv.estimatedDurationMinutes}m
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      {!srv.imageUrl && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                            {getServiceIcon(srv.id)}
                          </div>
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{srv.name}</h3>
                        </div>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {srv.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">{srv.defaultBuilding}</span>
                      <button
                        onClick={() => {
                          setFilterService(srv.id);
                          setIsBookingOpen(true);
                        }}
                        className="text-[#244A86] font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Reservar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Availability Calendar & Slot Inspector (HU-02) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Consulta de Disponibilidad en Tiempo Real</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explora el calendario visual de turnos libres por especialidad y profesional médico.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 italic">
                * Fotografías ilustrativas de demostración
              </span>
            </div>

            {/* Filter Bar with Interactive Calendar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Especialidad Clínica</label>
                  <select
                    value={filterService}
                    onChange={(e) => {
                      setFilterService(e.target.value as ServiceCategory);
                      setFilterProfId('all');
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#244A86]"
                  >
                    {CLINIC_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Filtrar por Profesional</label>
                  <select
                    value={filterProfId}
                    onChange={(e) => setFilterProfId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#244A86]"
                  >
                    <option value="all">Todos los profesionales del servicio</option>
                    {professionals
                      .filter((p) => p.serviceId === filterService)
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.room})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <InteractiveCalendar
                  selectedDate={filterDate}
                  onSelectDate={(d) => setFilterDate(d)}
                />
              </div>
            </div>

            {/* Saturday Notice Banner */}
            {scheduleInfo && (
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                scheduleInfo.isSaturday ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#244A86] shrink-0" />
                  <span className="font-semibold">{scheduleInfo.building} · {scheduleInfo.startHour} a {scheduleInfo.endHour}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-[11px] opacity-90">{scheduleInfo.note}</span>
                </div>
                {scheduleInfo.isSaturday && (
                  <span className="text-[10px] font-bold uppercase bg-amber-200/80 px-2 py-0.5 rounded text-amber-900 shrink-0">
                    Sábado Anexo
                  </span>
                )}
              </div>
            )}

            {/* Slots Matrix */}
            <div className="space-y-4 pt-2">
              {lookupProf.map((prof) => {
                const slots = RulesEngine.getAvailableSlots(prof, filterDate, appointments);
                const freeCount = slots.filter((s) => s.available).length;
                const isBlocked = prof.blockedDates.some((b) => b.date === filterDate);

                return (
                  <div key={prof.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <img
                          src={prof.avatarUrl}
                          alt={prof.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-2xs"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{prof.name}</h4>
                          <span className="text-[11px] text-[#244A86] font-medium">{prof.title} · {prof.room}</span>
                          <span className="text-[9px] text-slate-400 block leading-tight">* Foto demostrativa</span>
                        </div>
                      </div>
                      <div className="text-xs">
                        {isBlocked ? (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg font-semibold text-[11px]">
                            Fecha Bloqueada
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">
                            <strong className="text-slate-900">{freeCount}</strong> cupos libres de {slots.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {isBlocked ? (
                      <p className="text-xs text-rose-700 italic pt-3">
                        El profesional no tiene disponibilidad esta fecha por bloqueo de agenda médica.
                      </p>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-slate-500 italic pt-3">
                        No hay horarios programados para esta fecha.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-3">
                        {slots.map((s) => (
                          <button
                            key={s.time}
                            disabled={!s.available || !suspensionCheck.allowed}
                            onClick={() => {
                              setFilterService(prof.serviceId);
                              setIsBookingOpen(true);
                            }}
                            title={s.available ? `Cupo disponible a las ${s.time} (Clic para reservar)` : 'Ocupado'}
                            className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all ${
                              !s.available
                                ? 'bg-slate-200/70 text-slate-400 line-through cursor-not-allowed opacity-60'
                                : 'bg-white hover:bg-[#244A86] hover:text-white border border-slate-200 text-slate-800 shadow-2xs active:scale-95'
                            }`}
                          >
                            <span>{s.time}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
        initialServiceId={initialBookingServiceId || filterService}
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
