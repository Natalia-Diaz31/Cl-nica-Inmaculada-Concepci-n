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
  ShieldAlert,
  Users,
  CalendarCheck,
  CalendarPlus,
  Bell,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

interface HomeViewProps {
  currentPatient: Patient;
  onNavigateToBooking: () => void;
  onNavigateToMyAppointments: () => void;
  onNavigateToReminders: () => void;
  onNavigateToFamily?: () => void;
  isSuspended: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentPatient,
  onNavigateToBooking,
  onNavigateToMyAppointments,
  onNavigateToReminders,
  onNavigateToFamily,
  isSuspended,
}) => {
  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'medicina_general':
        return <Stethoscope className="w-5 h-5 text-[#244A86]" />;
      case 'medicina_interna':
        return <HeartPulse className="w-5 h-5 text-indigo-600" />;
      case 'fisioterapia':
        return <Activity className="w-5 h-5 text-teal-600" />;
      case 'enfermeria':
        return <Syringe className="w-5 h-5 text-sky-600" />;
      default:
        return <Stethoscope className="w-5 h-5 text-[#244A86]" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Personalized Welcome & Suspension Banner if applicable */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#244A86] text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Portal del Paciente · Clínica Inmaculada Concepción</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              ¡Bienvenido/a, {currentPatient.fullName}!
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              DUI: {currentPatient.documentId} · Teléfono: {currentPatient.phone}
            </p>
          </div>

          {/* Single Main Action CTA: "Reservar Cita" */}
          <button
            onClick={onNavigateToBooking}
            disabled={isSuspended}
            className={`px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 shrink-0 ${
              isSuspended
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-[#244A86] hover:bg-[#1B3664] text-white hover:shadow-lg active:scale-95'
            }`}
          >
            <CalendarPlus className="w-5 h-5" />
            <span>Reservar Cita Médica</span>
          </button>
        </div>

        {/* Suspension Alert if applicable */}
        {isSuspended && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm">Agendamiento en línea suspendido</p>
              <p className="mt-1 leading-relaxed">
                Has acumulado 3 inasistencias en los últimos 6 meses. Para justificar tus ausencias y reservar nuevamente, comunícate con recepción o acércate a la ventanilla parroquial.
              </p>
              <div className="mt-2.5 flex items-center gap-4 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#244A86]" />
                  <span>Tel. Recepción: (503) 2257-8900</span>
                </span>
                <span>WhatsApp: (503) 7845-1234</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Access Tiles: Mis Citas & Recordatorios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Tile 1: Mis Citas */}
          <button
            onClick={onNavigateToMyAppointments}
            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/40 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#244A86] flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block group-hover:text-[#244A86] transition-colors">
                  Mis Citas
                </span>
                <span className="text-[11px] text-slate-500">
                  Consultar, cancelar o reprogramar
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Tile 2: Recordatorios */}
          <button
            onClick={onNavigateToReminders}
            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/40 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block group-hover:text-[#244A86] transition-colors">
                  Recordatorios
                </span>
                <span className="text-[11px] text-slate-500">
                  Avisos previos de 24 h y 2 h
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Tile 3: Familiares */}
          <button
            onClick={onNavigateToFamily}
            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/40 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block group-hover:text-[#244A86] transition-colors">
                  Familiares
                </span>
                <span className="text-[11px] text-slate-500">
                  {currentPatient.familyMembers?.length || 0} registrados para citas
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* 2. Specialties Section: PURELY INFORMATIVE (NO booking buttons inside cards!) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Especialidades Clínicas Parroquiales
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Información de los cuatro servicios médicos brindados por la Parroquia Inmaculada Concepción
            </p>
          </div>
          <span className="text-xs font-semibold text-[#244A86] bg-blue-50 px-2.5 py-1 rounded-lg">
            4 servicios disponibles
          </span>
        </div>

        {/* 4 Informative Cards (Only images, titles, descriptions, duration, building. NO booking buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CLINIC_SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              {/* Illustrative image */}
              {srv.imageUrl && (
                <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
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

              {/* Informative text content */}
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
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{srv.defaultBuilding}</span>
                  </span>
                  <span>Turnos de {srv.estimatedDurationMinutes}m</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Parochial Clinic Schedule & Building Information */}
      <section className="bg-slate-100/90 rounded-2xl p-4 sm:p-5 border border-slate-200 text-xs text-slate-700 space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
          <Clock className="w-4 h-4 text-[#244A86]" />
          <span>Horarios Oficiales y Sedes de Atención</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-[#244A86] font-bold">
              <MapPin className="w-4 h-4" />
              <span>Edificio Principal</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              <strong>Lunes a Viernes:</strong> 8:00 a. m. a 5:00 p. m.
            </p>
            <p className="text-[11px] text-slate-500">
              Consultorios 1, 2, 3 y 4. Atención regular con cita previa.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <MapPin className="w-4 h-4" />
              <span>Edificio Anexo (Sábados)</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              <strong>Sábados:</strong> 12:00 m. a 5:00 p. m.
            </p>
            <p className="text-[11px] text-slate-500">
              Jornada comunitaria parroquial de fin de semana.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Team Showcase with Demonstration Note */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Equipo Profesional de Salud
              </h2>
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Demostración
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal asignado a las especialidades parroquiales
            </p>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            * Fotografías ilustrativas de demostración
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INITIAL_PROFESSIONALS.map((prof) => (
            <div
              key={prof.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col items-center text-center space-y-3"
            >
              <img
                src={prof.avatarUrl}
                alt={prof.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shadow-2xs"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{prof.name}</h3>
                <p className="text-xs text-[#244A86] font-semibold">{prof.serviceName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{prof.room} · {prof.building}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
