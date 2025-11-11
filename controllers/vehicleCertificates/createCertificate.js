import VehicleCertificate from '../../models/VehicleCertificate.js';
import crypto from 'crypto'

export default async function createCertificate(req, res) {
  try {
    const {
      destinatario,
      fechaExpedicion, // ISO o 'YYYY-MM-DDTHH:mm:ssZ'
      datosVehiculo = {},
      resultado = 'NO SE ENCONTRÓ',
      resultadoDescripcion,
      observaciones,
      folio,
      barcode,
      selloDigital,
      cadenaOriginal,
      vigenciaHoras,
      urlVerificacion,
      entidadEmisora,
      tituloDocumento,
      baseLegal,
  images = [],
    } = req.body;

    const user = req.user || null;

    // Validaciones mínimas
    const faltantes = [];
    ['marca','tipo','modelo','anio','color','numeroMotor','serieNiv','placas','facturaNumero'].forEach(k => { if (!datosVehiculo[k]) faltantes.push('datosVehiculo.'+k); });
    if (!destinatario) faltantes.push('destinatario');
    if (!fechaExpedicion) faltantes.push('fechaExpedicion');
    if (faltantes.length) return res.status(400).json({ success:false, message:'Campos requeridos faltantes', fields: faltantes });

    const cert = new VehicleCertificate({
      destinatario: String(destinatario).trim(),
      fechaExpedicion: new Date(fechaExpedicion),
      datosVehiculo,
      resultado,
      resultadoDescripcion,
      observaciones,
      folio,
      barcode,
      selloDigital,
      cadenaOriginal,
      vigenciaHoras,
      urlVerificacion,
      entidadEmisora,
      tituloDocumento,
      baseLegal,
  images: Array.isArray(images) ? images.slice(0,20) : [],
      createdBy: user ? String(user._id) : undefined,
    });

    // Defaults inteligentes si no vinieron en la petición
    // Mongoose asigna _id al instanciar; podemos usarlo para folio/barcode
    const oid = String(cert._id || '');
    if (!cert.folio) cert.folio = oid.slice(-8).toUpperCase();
    if (!cert.barcode) cert.barcode = (Date.now().toString().slice(-7) + oid.slice(-9, -1)).replace(/[^0-9]/g,'').slice(0,16);
    if (!cert.vigenciaHoras) cert.vigenciaHoras = 24;
    if (!cert.urlVerificacion) cert.urlVerificacion = 'https://fiscaliamorelos.gob.mx';
    if (!cert.baseLegal) cert.baseLegal = 'CON FUNDAMENTO EN EL ARTICULO 61 FRACCIÓN X DEL REGLAMENTO DE LA LEY ORGÁNICA DE LA FISCALÍA GENERAL DEL ESTADO DE MORELOS, LA UNIDAD DE BIENES ASEGURADOS TIENE A BIEN EXPEDIR LA PRESENTE CONSTANCIA A:';
    if (!cert.resultadoDescripcion) cert.resultadoDescripcion = 'REGISTRO DE REPORTE DE ROBO NI ALTERACIÓN EN LOS MEDIOS DE IDENTIFICACIÓN VEHICULAR.';
    if (!cert.selloDigital) cert.selloDigital = `||${oid}|${crypto.randomBytes(12).toString('hex')}|${new Date(cert.fechaExpedicion).toISOString()}||`;
    if (!cert.cadenaOriginal) cert.cadenaOriginal = `*|${cert.barcode}|${datosVehiculo.serieNiv}|${datosVehiculo.placas}|${new Date(cert.fechaExpedicion).toISOString()}|*`;

    await cert.save();
    res.status(201).json({ success:true, certificate: cert });
  } catch (e) {
    res.status(500).json({ success:false, message:'Error al crear constancia', error: e.message });
  }
}
