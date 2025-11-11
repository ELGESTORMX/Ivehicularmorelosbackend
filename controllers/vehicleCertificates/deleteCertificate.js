import VehicleCertificate from '../../models/VehicleCertificate.js'

// DELETE /api/vehicle-certificates/:id
export default async function deleteCertificate(req, res){
  try{
    const { id } = req.params;
    const doc = await VehicleCertificate.findByIdAndDelete(id);
    if(!doc) return res.status(404).json({ success:false, message:'Constancia no encontrada' });
    return res.json({ success:true, message:'Constancia eliminada', id });
  }catch(e){
    return res.status(500).json({ success:false, message:'Error al eliminar constancia', error: e.message });
  }
}
