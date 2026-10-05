/* REEF Records · Contacto. Pedidos de merch, donaciones y alianzas llegan al mismo WhatsApp corporativo. */

// Número en formato internacional, solo dígitos (ej. 573001234567).
// Vacío: WhatsApp abre el mensaje y deja elegir el contacto.
export const WHATSAPP = ''

export function enlaceWhatsApp(mensaje: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`
}
