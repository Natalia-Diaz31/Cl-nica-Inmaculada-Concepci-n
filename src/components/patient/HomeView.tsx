import React from 'react';
import { ClinicService, HealthcareProfessional, Patient } from '../../types';
import { CLINIC_SERVICES, INITIAL_PROFESSIONALS } from '../../services/storage';
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  HeartPulse,
  Activity,
  Syringe,
  Phone,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Users,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  HelpCircle,
  Info,
  Award,
} from 'lucide-react';

interface HomeViewProps {
  currentPatient: Patient;
  onNavigateToBooking: (serviceId?: string) => void;
  onNavigateToMyAppointments: () => void;
  onNavigateToWaitlist: () => void;
  onOpenAuth: () => void;
  isSuspended: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentPatient,
  onNavigateToBooking,
  onNavigateToMyAppointments,
  onNavigateToWaitlist,
  onOpenAuth,
  isSuspended,
}) => {
  const getServiceIcon = (id: string) => {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Figma Screen P01: Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B3664] via-[#244A86] to-[#2E5EA6] text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-blue-900/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Clínica Parroquial Inmaculada Concepción</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Tu salud en buenas manos, con la calidez de nuestra parroquia
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl">
            Gestiona tus citas médicas de forma rápida, autónoma y sin esperas telefónicas. Reserva para ti o tus familiares con anticipación de 2 horas a 60 días.
          </p>

          {/* Action buttons matching Figma */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToBooking()}
              disabled={isSuspended}
              className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 ${
                isSuspended
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-white text-[#244A86] hover:bg-blue-50 hover:shadow-lg active:scale-98'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-[#244A86]" />
              <span>Reservar Cita en Línea</span>
            </button>

            <button
              onClick={onNavigateToMyAppointments}
              className="px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 active:scale-98"
            >
              <Calendar className="w-4 h-4 text-blue-200" />
              <span>Mis Citas Programadas</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="px-4 py-3 rounded-xl font-medium text-xs text-blue-200 hover:text-white transition-colors"
            >
              Identificarme / Cambiar Paciente
            </button>
          </div>
        </div>
      </section>

      {/* Services Section with Discrete Images */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Especialidades Médicas Disponibles
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Atención presencial en consultorios equipados para la comunidad
            </p>
          </div>
          <span className="text-xs font-semibold text-[#244A86]">
            1 cita activa por especialidad
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CLINIC_SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Discrete Clinical Image */}
              {srv.imageUrl && (
                <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold text-slate-800 shadow-2xs">
                    ~{srv.estimatedDurationMinutes} min
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 text-white">
                    <div className="w-7 h-7 rounded-lg bg-[#244A86]/90 backdrop-blur-sm flex items-center justify-center">
                      {getServiceIcon(srv.id)}
                    </div>
                    <span className="text-xs font-bold drop-shadow-sm">{srv.name}</span>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  {!srv.imageUrl && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                        {getServiceIcon(srv.id)}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{srv.name}</h3>
                    </div>
                  )}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {srv.defaultBuilding}
                  </span>
                  <button
                    onClick={() => onNavigateToBooking(srv.id)}
                    disabled={isSuspended}
                    className="px-3 py-1.5 bg-[#244A86] hover:bg-[#1B3664] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 shadow-2xs active:scale-95"
                  >
                    <span>Agendar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Medical Professionals Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Equipo Médico Parroquial
              </h2>
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Demostración
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Profesionales dedicados al cuidado de tu familia
            </p>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            * Fotografías de demostración ilustrativa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INITIAL_PROFESSIONALS.map((prof) => (
            <div
              key={prof.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col items-center text-center space-y-3"
            >
              <div className="relative">
                <img
                  src={prof.avatarUrl}
                  alt={prof.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-100 shadow-xs"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Activo en clínica" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{prof.name}</h4>
                <p className="text-[11px] text-[#244A86] font-semibold">{prof.serviceName}</p>
                <p className="text-[11px] text-slate-500">{prof.room}</p>
              </div>

              <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{prof.building}</span>
                <span className="font-mono">{prof.slotDurationMinutes} min</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Buildings & Schedule Banner (RN-07) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#244A86] border border-blue-100 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-md">
              Sede Principal
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Edificio Principal (Lunes a Viernes)</h4>
            <p className="text-xs text-slate-600">Av. Parroquial #12, San Salvador</p>
            <p className="text-xs text-slate-500 font-mono">Horario: 8:00 a. m. a 5:00 p. m.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
              Atención en Sábados
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Edificio Anexo</h4>
            <p className="text-xs text-slate-600">Calle Los Olivos #4, San Salvador</p>
            <p className="text-xs text-amber-800 font-semibold font-mono">
              Horario exclusivo de sábados: 12:00 p. m. a 5:00 p. m.
            </p>
          </div>
        </div>
      </section>

      {/* Parish Rules & Patient Guidance Card */}
      <section className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 text-xs text-slate-700 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#244A86]" />
          <span>Reglas de Atención y Compromiso Parroquial</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-slate-900 block">Cancelación oportuna (24h)</span>
            <p className="text-[11px] text-slate-500">
              Cancela o reprograma en línea hasta 24 horas antes para que tu cupo sea ofrecido a la lista de espera solidaria.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-slate-900 block">Política de inasistencias</span>
            <p className="text-[11px] text-slate-500">
              3 inasistencias en 6 meses suspenden el agendamiento digital. Recepción puede rehabilitar tu cuenta con justificación.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-slate-900 block">Recordatorios automáticos</span>
            <p className="text-[11px] text-slate-500">
              Recibirás notificaciones a 24 h y 2 h de tu cita vía WhatsApp o SMS con confirmación de asistencia en 1 clic.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
