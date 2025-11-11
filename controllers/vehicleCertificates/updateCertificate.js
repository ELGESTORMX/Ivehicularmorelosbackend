import VehicleCertificate from '../../models/VehicleCertificate.js'

// PATCH /api/vehicle-certificates/:id
export default async function updateCertificate(req, res){
  try{
    const { id } = req.params;
    const allowed = [
      'destinatario','fechaExpedicion','datosVehiculo','resultado','observaciones','resultadoDescripcion','folio','images'
    ];
    const payload = {};
    for (const k of allowed){ if (k in req.body) payload[k] = req.body[k]; }
    payload.updatedAt = new Date();
    const updated = await VehicleCertificate.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean({ defaults: true });
    if(!updated) return res.status(404).json({ success:false, message:'Constancia no encontrada' });
    return res.json({ success:true, certificate: updated });
  }catch(e){
    return res.status(500).json({ success:false, message:'Error al actualizar constancia', error: e.message });
  }
}
