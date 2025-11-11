import VehicleCertificate from '../../models/VehicleCertificate.js'
import mongoose from 'mongoose'

// Público: permite consultar por :id o ?id=
export default async function getById(req, res) {
  try {
    const id = req.params.id || req.query.id
    if (!id) return res.status(400).json({ success:false, message:'Falta parámetro id' })
    // Manejar ids no válidos sin explotar con 500
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success:false, message:'No se encontró la constancia' })
    }
    const cert = await VehicleCertificate.findById(id).lean({ defaults: true })
    if (!cert) return res.status(404).json({ success:false, message:'No se encontró la constancia' })
    const exp = new Date(cert.fechaExpedicion)
    const msVig = (cert.vigenciaHoras || 24) * 60 * 60 * 1000
    const validUntil = new Date(exp.getTime() + msVig)
    const now = new Date()
    const isExpired = now > validUntil
    res.set('Cache-Control', 'no-store')
    return res.json({ success:true, certificate: cert, meta: { validUntil, isExpired } })
  } catch (e) {
    return res.status(500).json({ success:false, message:'Error al consultar constancia', error: e.message })
  }
}
