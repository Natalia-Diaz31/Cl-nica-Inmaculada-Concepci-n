import React from 'react';
import { Building, Phone, Mail, Clock, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300 text-xs border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#244A86] text-white flex items-center justify-center font-bold text-base">
                ✝
              </div>
              <div>
                <span className="font-bold text-white text-sm block">Clínica Inmaculada Concepción</span>
                <span className="text-[11px] text-slate-400">Pastoral de Salud Parroquial</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Atención médica integral, solidaria y con calidez humana para la comunidad salvadoreña.
            </p>
          </div>

          {/* Col 2: Locations & Buildings */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Edificios y Sedes</h4>
            <div className="space-y-2 text-slate-400 text-[11px]">
              <div>
                <span className="font-semibold text-slate-200 block">Edificio Principal:</span>
                <p>Av. Parroquial #12, San Salvador</p>
                <p className="text-slate-500">Lunes a Viernes: 8:00 a. m. - 5:00 p. m.</p>
              </div>
              <div className="pt-1">
                <span className="font-semibold text-amber-300 block">Edificio Anexo (Sábados):</span>
                <p>Calle Los Olivos #4, San Salvador</p>
                <p className="text-slate-500">Sábados: 12:00 p. m. - 5:00 p. m.</p>
              </div>
            </div>
          </div>

          {/* Col 3: Services */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Servicios con Cita</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>Medicina General y Familiar</li>
              <li>Medicina Interna y Crónicos</li>
              <li>Fisioterapia y Rehabilitación</li>
              <li>Enfermería y Curaciones</li>
              <li className="text-slate-500 pt-1">Farmacia parroquial: atención continua sin cita previa</li>
            </ul>
          </div>

          {/* Col 4: Contacts & Emergencies */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Contacto y Ayuda</h4>
            <div className="space-y-1.5 text-slate-400 text-[11px]">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>Recepción: (503) 2257-8900</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: (503) 7845-1234</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>contacto@clinicainmaculada.sv</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                En caso de emergencias médicas de riesgo vital, acude de inmediato al hospital nacional más cercano.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Clínica Parroquial Inmaculada Concepción. Todos los derechos reservados.</p>
          <p className="text-slate-400">
            Consultora C.R.A.A · Proyecto de Prototipado y Gestión de Citas
          </p>
        </div>
      </div>
    </footer>
  );
};
