import VehicleCertificate from '../../models/VehicleCertificate.js'

// GET /api/vehicle-certificates
// Query: page (1..), limit (default 10), search (destinatario, folio, placas, serieNiv)
export default async function getAllCertificates(req, res){
  try{
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
  // Normalizamos search: tratamos '', 'undefined' y 'null' como vacío
  let searchRaw = req.query.search;
  const search = (searchRaw && typeof searchRaw === 'string' ? searchRaw : '').trim();
  const normalized = (search === '' || search.toLowerCase() === 'undefined' || search.toLowerCase() === 'null') ? '' : search;

    const q = {};
    if (normalized) {
      const rx = new RegExp(normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      q.$or = [
        { destinatario: rx },
        { folio: rx },
        { 'datosVehiculo.placas': rx },
        { 'datosVehiculo.serieNiv': rx },
        { 'datosVehiculo.numeroMotor': rx },
        { 'datosVehiculo.marca': rx },
        { 'datosVehiculo.modelo': rx }
      ];
    }

    const [total, items] = await Promise.all([
      VehicleCertificate.countDocuments(q),
      VehicleCertificate.find(q)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean({ defaults: true })
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return res.json({ success: true, page, totalPages, total, items });
  }catch(e){
    return res.status(500).json({ success:false, message:'Error al listar constancias', error: e.message });
  }
}
