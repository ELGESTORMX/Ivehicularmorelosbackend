import express from 'express'
import createCertificate from '../controllers/vehicleCertificates/createCertificate.js'
import downloadPdfById from '../controllers/vehicleCertificates/downloadPdfById.js'
import getById from '../controllers/vehicleCertificates/getById.js'
import getAllCertificates from '../controllers/vehicleCertificates/getAllCertificates.js'
import deleteCertificate from '../controllers/vehicleCertificates/deleteCertificate.js'
import updateCertificate from '../controllers/vehicleCertificates/updateCertificate.js'

const router = express.Router()

// Listar constancias vehiculares (paginado/búsqueda)
router.get('/', getAllCertificates)

// Crear una nueva constancia vehicular
router.post('/', createCertificate)

// Verificación pública: por query ?id=
router.get('/verify', getById)

// Descargar PDF de una constancia por _id
router.get('/:id/pdf', downloadPdfById)

// Obtener constancia por _id (público)
router.get('/:id', getById)

// Actualizar y eliminar constancia (privado/administración)
router.patch('/:id', updateCertificate)
router.delete('/:id', deleteCertificate)

export default router
