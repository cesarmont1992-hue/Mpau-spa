/* ============================================================
   CONFIGURACIÓN DE LA AGENDA  (edita solo este archivo)
   Los nombres, horarios y duraciones de abajo son EJEMPLOS.
   Días de la semana: 0 = domingo, 1 = lunes ... 6 = sábado.
   Horas en formato 24 h ("14:30").
   ============================================================ */
window.AGENDA_CONFIG = {
  whatsapp: "573003053253",
  pasoMinutos: 30,          // cada cuánto puede empezar una cita
  anticipacionHoras: 2,     // mínimo de horas entre ahora y la cita
  diasAdelante: 45,         // hasta cuántos días adelante se puede reservar

  servicios: [
    { id: "antiedad",    nombre: "Tratamiento antiedad",    minutos: 60 },
    { id: "hidrataciones", nombre: "Hidrataciones",         minutos: 45 },
    { id: "antiacne",    nombre: "Tratamiento anti acné",   minutos: 60 },
    { id: "radiofrecuencia", nombre: "Radiofrecuencia",     minutos: 45 },
    { id: "limpieza",    nombre: "Limpieza facial profunda", minutos: 75 }
  ],

  cosmetologas: [
    {
      id: "c1", nombre: "Cosmetóloga 1",
      horario: {
        1: [["09:00", "12:00"], ["14:00", "18:00"]],
        2: [["09:00", "12:00"], ["14:00", "18:00"]],
        3: [["09:00", "12:00"], ["14:00", "18:00"]],
        4: [["09:00", "12:00"], ["14:00", "18:00"]],
        5: [["09:00", "12:00"], ["14:00", "18:00"]],
        6: [["09:00", "13:00"]]
      },
      diasLibres: []        // fechas sin atención, ej.: ["2026-12-08"]
    },
    {
      id: "c2", nombre: "Cosmetóloga 2",
      horario: {
        2: [["10:00", "16:00"]],
        3: [["10:00", "16:00"]],
        4: [["10:00", "16:00"]],
        5: [["10:00", "16:00"]],
        6: [["09:00", "14:00"]]
      },
      diasLibres: []
    }
  ],

  // Días en que el spa no atiende (festivos, vacaciones...)
  diasCerrado: [],          // ej.: ["2026-12-25", "2027-01-01"]

  // Citas que ya tienes agendadas por otro medio (WhatsApp, llamada...).
  // Agrégalas aquí para que ese horario aparezca ocupado.
  citasOcupadas: [
    // { fecha: "2026-11-20", cosmetologa: "c1", inicio: "10:00", minutos: 60 }
  ]
};
