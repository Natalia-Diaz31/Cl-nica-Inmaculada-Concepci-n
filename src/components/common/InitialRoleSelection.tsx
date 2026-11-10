import React from 'react';
import { Role } from '../../types';
import { User, ClipboardList, Stethoscope, Clock, MapPin, ChevronRight, HeartPulse, ShieldCheck } from 'lucide-react';

interface InitialRoleSelectionProps {
  onSelectRole: (role: Role) => void;
}

export const InitialRoleSelection: React.FC<InitialRoleSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-full flex flex-col justify-between py-8 sm:py-12 px-4 sm:px-6 max-w-4xl mx-auto w-full">
      {/* Top Brand & Identity Section */}
      <div className="text-center space-y-3 mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#244A86] text-white shadow-xl ring-4 ring-blue-100">
          <span className="text-3xl sm:text-4xl font-bold">✝</span>
        </div>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#244A86]">
            Mi Cita Parroquial
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-600 mt-0.5">
            Clínica Inmaculada Concepción
          </p>
        </div>

        {/* Brief Welcome Message */}
        <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
          Bienvenido a la solución de gestión de citas médicas de la Parroquia Inmaculada Concepción. Te brindamos atención cercana, digna y comunitaria en nuestras cuatro especialidades.
        </p>
      </div>

      {/* Main Question & Exactly 3 Role Selection Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-sm space-y-6">
        <div className="text-center pb-2 border-b border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#244A86] bg-blue-50 px-3 py-1 rounded-full inline-block mb-1.5">
            Acceso al Sistema
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            ¿Con qué rol quieres entrar?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Selecciona tu perfil para ingresar a tu espacio correspondiente:
          </p>
        </div>

        {/* Exact 3 Buttons: Paciente, Recepción, Profesional de salud */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Paciente */}
          <button
            onClick={() => onSelectRole('paciente')}
            className="group text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-[#244A86] bg-slate-50/60 hover:bg-blue-50/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between active:scale-[0.98]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#244A86] group-hover:bg-[#244A86] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-3.5">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#244A86] transition-colors">
                Paciente
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Inicia sesión con tu DUI para reservar citas médicas, consultar tus citas y dar seguimiento a tu salud.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-[#244A86]">
              <span>Ingresar como Paciente</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 2. Recepción */}
          <button
            onClick={() => onSelectRole('recepcion')}
            className="group text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-[#244A86] bg-slate-50/60 hover:bg-blue-50/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between active:scale-[0.98]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-[#244A86] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-3.5">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#244A86] transition-colors">
                Recepción
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Control de agenda diaria, marcado de llegadas presenciales, agendamiento asistido y gestión de inasistencias.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-[#244A86]">
              <span>Ingresar a Recepción</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 3. Profesional de Salud */}
          <button
            onClick={() => onSelectRole('profesional')}
            className="group text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-[#244A86] bg-slate-50/60 hover:bg-blue-50/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between active:scale-[0.98]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 group-hover:bg-[#244A86] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-3.5">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#244A86] transition-colors">
                Profesional de Salud
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Consulta privada de citas asignadas, configuración de días y horarios de atención, y bloqueo de fechas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-[#244A86]">
              <span>Ingresar como Profesional</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Clinic Schedule & Building Info Banner */}
      <div className="mt-6 bg-slate-100/90 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#244A86] shrink-0" />
            <span>
              <strong>Lunes a Viernes:</strong> 8:00 a. m. a 5:00 p. m. (Edificio Principal)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Sábados:</strong> 12:00 m. a 5:00 p. m. (Edificio Anexo)
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 italic text-center sm:text-left pt-1 border-t border-slate-200/60">
          Especialidades disponibles: Medicina General · Medicina Interna · Fisioterapia · Enfermería
        </p>
      </div>
    </div>
  );
};
