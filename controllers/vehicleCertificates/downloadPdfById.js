import VehicleCertificate from '../../models/VehicleCertificate.js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { __dirname } from '../../utils.js'

// GET /api/vehicle-certificates/:id/pdf
export default async function downloadPdfById(req, res) {
  try {
    const { id } = req.params;
    const cert = await VehicleCertificate.findById(id).lean({ defaults: true });
    if (!cert) return res.status(404).json({ message: 'No se encontró la constancia.' });

  const pdfDoc = await PDFDocument.create();
  // Posiciones editables en un solo bloque (modifica aquí)
  const POS = {
    page: { w: 595.28, h: 841.89 }, // A4
    titulo: { x: 140, y: 780, size: 15, bold: true },
    fechaLabel: { x: 40, y: 700, size: 11, bold: true },
    fechaValue: { x: 37, y: 635, size: 11, bold: true },
    vehicleRows: [
      { label: 'MARCA', xLabel: 91, y: 568, xValue: 150 },
      { label: 'TIPO', xLabel: 95, y: 524, xValue: 150 },
      { label: 'MODELO', xLabel: 93, y: 480, xValue: 150 },
      { label: 'AÑO', xLabel: 93, y: 496, xValue: 150 },
      { label: 'COLOR', xLabel: 91, y: 437, xValue: 150 },
      { label: 'N° MOTOR', xLabel: 78, y: 392, xValue: 150 },
      { label: 'SERIE/NIV', xLabel: 78, y: 350, xValue: 150 },
      { label: 'PLACAS', xLabel: 90, y: 305, xValue: 150 },
      { label: 'FACTURA NÚMERO', xLabel: 80, y: 260, xValue: 150 }
    ],
    legal: { x: 220, y: 660, size: 10, bold: false },
    destinatario: { x: 205, y: 545, size: 11, bold: true },
    haceConstar: { x: 300, y: 620, size: 13, bold: true },
    parrafoNiv: { x: 220, y: 605, size: 10, bold: false },
    resultado: { x: 300, y: 560, size: 12, bold: true },
    resultadoDesc: { x: 220, y: 545, size: 10, bold: false },
    obsLabel: { x: 220, y: 520, size: 11, bold: true },
    obsValue: { x: 220, y: 505, size: 10, bold: false },
    folio: { x: 430, y: 800, size: 10, bold: false },
  // Dígitos bajo el código de barras: abarcar desde el inicio hasta el final del código
  barcodeSpan: { x1: 438, x2: 550, y: 620, size: 8, bold: true },
  barcode: { x: 350, y: 620, size: 10, bold: false },
    selloLabel: { x: 40, y: 140, size: 10, bold: true },
    selloValue: { x: 40, y: 128, size: 9, bold: false },
    cadenaLabel: { x: 40, y: 112, size: 10, bold: true },
    cadenaValue: { x: 40, y: 100, size: 9, bold: false },
    vigencia: { x: 40, y: 20, size: 10, bold: true },
    qrImage: { x: 40, y: 90, w: 115, h: 115 },
    qrLabel: { x: 420, y: 185, size: 10, bold: true },
    qrUrl: { x: 420, y: 172, size: 9, bold: false }
  };
  const page = pdfDoc.addPage([POS.page.w, POS.page.h]);
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const draw = (text, x, y, size = 11, bold = false, color = rgb(0, 0, 0)) => {
      page.drawText(String(text || ''), {
        x, y, size,
        font: bold ? helvBold : helv,
        color,
      });
    };

    // Dibuja números espaciados uniformemente de x1 a x2 (centrando cada dígito)
    const drawSpacedDigits = (text, span) => {
      if (!span) return;
      const digits = String(text || '').replace(/[^0-9]/g, '').split('');
      if (!digits.length) return;
      const n = digits.length;
      if (n === 1) { draw(digits[0], span.x1, span.y, span.size, span.bold); return; }
      const step = (span.x2 - span.x1) / (n - 1);
      for (let i = 0; i < n; i++) {
        const ch = digits[i];
        const fontObj = span.bold ? helvBold : helv;
        const w = fontObj.widthOfTextAtSize(ch, span.size);
        const x = span.x1 + step * i - (w / 2);
        draw(ch, x, span.y, span.size, span.bold);
      }
    };

    // Intentar embeder plantilla de fondo si existe
    try {
      const candidates = [
        path.join(__dirname, '..', 'frontEnd', 'public', 'pdf', 'pdfconstancia_page-0001.jpg'),
        path.join(__dirname, 'public', 'templates', 'pdfconstancia_page-0001.jpg')
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const imgBytes = fs.readFileSync(p);
          const jpg = await pdfDoc.embedJpg(imgBytes);
          const { width, height } = jpg.scale(1);
          page.drawImage(jpg, { x: 0, y: 0, width: 595.28, height: 841.89 });
          break;
        }
      }
    } catch {}

  // Título removido (ya está en la imagen de fondo)

    // Fecha de expedición (rojo en plantilla): ubicamos aproximado lado izquierdo
    const fexp = cert.fechaExpedicion ? new Date(cert.fechaExpedicion) : null;
    if (fexp) {
      draw(
        fexp.toISOString().slice(0,19).replace('T',' ') + ' HORAS',
        POS.fechaValue.x,
        POS.fechaValue.y,
        POS.fechaValue.size,
        true,
        rgb(1, 0, 0) // rojo
      );
    }

    // Datos del vehículo (cada fila con coordenadas explícitas para edición sencilla)
    const d = cert.datosVehiculo || {};
    const vehicleRows = POS.vehicleRows.map((r) => ({
      ...r,
      value: {
        'MARCA': d.marca,
        'TIPO': d.tipo,
        'MODELO': d.modelo,
        'AÑO': d.anio,
        'COLOR': d.color,
        'N° MOTOR': d.numeroMotor,
        'SERIE/NIV': d.serieNiv,
        'PLACAS': d.placas,
        'FACTURA NÚMERO': d.facturaNumero
      }[r.label]
    }));
    // Para mover una fila cambia xLabel, y y xValue directamente arriba
    // Mostrar solo el valor (sin etiquetas como MARCA, TIPO, MODELO, etc.)
    for (const row of vehicleRows) {
      // Ocultar el campo AÑO (no dibujar valor 2023 ni similar)
      if (row.label === 'AÑO') continue;
      // Todos los demás valores en NEGRITA y +2pt de tamaño
      draw(String(row.value || ''), row.xLabel, row.y, 10, true);
    }

    // Cuerpo central "HACE CONSTAR"
  // Texto legal removido (ya está en la plantilla de fondo)
  // Destinatario (nombre) - fallback a cert.name si el frontend envió "name" en vez de "destinatario"
  const destinatarioText = String((cert.destinatario || cert.name || '')).toUpperCase();
  if (destinatarioText) {
    draw(destinatarioText, POS.destinatario.x, POS.destinatario.y, POS.destinatario.size, POS.destinatario.bold);
  }
  // 'HACE CONSTAR' removido (ya en fondo)
    const nivText = d.serieNiv ? `RELACIONADOS CON EL DESIFRADOR DEL NÚMERO DE IDENTIFICACIÓN VEHICULAR (NIV): ${d.serieNiv}` : '';
  // Párrafo explicativo removido (ya está en la plantilla de fondo)

    // Resultado
  // Resultado removido (ya está en el background)

    // Observaciones
    // Observaciones removidas (se muestran en plantilla de fondo)

    // Código de barras: mostrar solo dígitos aleatorios con misma longitud que el original
    // (Los números se dibujan en negrita, separados y extendidos de extremo a extremo del código)
    if (cert.barcode) {
      const originalDigits = String(cert.barcode || '').replace(/[^0-9]/g, '');
      const len = originalDigits.length || 14;
      const randomDigits = Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
      drawSpacedDigits(randomDigits, POS.barcodeSpan);
    }

    // Sello digital, cadena y vigencia removidos a petición (se asume vienen en el fondo o no se muestran)

    // QR con liga de verificación -> apuntar a la página pública de validación (/sicive-validate)
    try {
  // Construimos la base de validación de forma automática (sin depender de variables de entorno)
  // Prioridad: Origin > Referer.origin > X-Forwarded-Proto/Host > req.protocol + req.get('host') > localhost
  const originHeader = String(req.headers.origin || '').trim();
  const refererHeader = String(req.headers.referer || '').trim();
  let refererOrigin = '';
  if (refererHeader) {
    try { refererOrigin = new URL(refererHeader).origin; } catch {}
  }
  const xfProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const xfHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const proto = xfProto || (req.secure ? 'https' : (req.protocol || 'http'));
  const host = xfHost || String(req.get('host') || '').trim();
  const serverBase = host ? `${proto}://${host}` : '';
  const chosenBase = (originHeader || refererOrigin || serverBase || 'http://localhost:5173').replace(/\/$/, '');
  // Apuntar a la vista estática exacta consulta.html
  const withPath = `${chosenBase}/sicive/consulta.html`;
  let verifyUrl = `${withPath}?id=${encodeURIComponent(String(cert._id))}`;
      // Si existe folio, añadirlo también para mayor compatibilidad
      if (cert.folio) {
        verifyUrl += `&folio=${encodeURIComponent(String(cert.folio))}`;
      }
      const dataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 180 });
      const b64 = dataUrl.split(',')[1];
      const pngBytes = Buffer.from(b64, 'base64');
      const qrImg = await pdfDoc.embedPng(pngBytes);
      page.drawImage(qrImg, { x: POS.qrImage.x, y: POS.qrImage.y, width: POS.qrImage.w, height: POS.qrImage.h });
      // No mostrar URL en texto bajo el QR: sólo la imagen escaneable.
    } catch (err) {
      // si falla la generación del QR, continuar sin bloquear la generación del PDF
      console.error('QR generation failed:', err && err.message);
    }

  const bytes = await pdfDoc.save();
  res.setHeader('Content-Type', 'application/pdf');
  const inline = String(req.query.inline || '').toLowerCase();
  const asInline = inline === '1' || inline === 'true' || inline === 'yes';
  const disposition = asInline ? 'inline' : 'attachment';
  res.setHeader('Content-Disposition', `${disposition}; filename="constancia-vehicular-${cert._id}.pdf"`);
    res.send(Buffer.from(bytes));
  } catch (e) {
    res.status(500).json({ message: 'Error al generar PDF', error: e.message });
  }
}
