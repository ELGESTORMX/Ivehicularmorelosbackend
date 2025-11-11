import mongoose from 'mongoose'

const { Schema } = mongoose;

const VehicleDataSchema = new Schema({
	marca: { type: String, required: true },
	tipo: { type: String, required: true },
	modelo: { type: String, required: true },
	anio: { type: String, required: true },
	color: { type: String, required: true },
	numeroMotor: { type: String, required: true },
	serieNiv: { type: String, required: true },
	placas: { type: String, required: true },
	facturaNumero: { type: String, required: true },
}, { _id: false });

const VehicleCertificateSchema = new Schema({
	destinatario: { type: String, required: true }, // Persona a quien se expide
	fechaExpedicion: { type: Date, required: true },
	datosVehiculo: { type: VehicleDataSchema, required: true },
	resultado: { type: String, default: 'NO SE ENCONTRÓ' },
	observaciones: { type: String },

	folio: { type: String }, // Folio visible en documento (puede diferir de _id)
	barcode: { type: String }, // Texto numérico bajo el código de barras
	selloDigital: { type: String },
	cadenaOriginal: { type: String },
	vigenciaHoras: { type: Number, default: 24 },
	urlVerificacion: { type: String },
	entidadEmisora: { type: String, default: 'Fiscalía General del Estado de Morelos' },
	tituloDocumento: { type: String, default: 'Constancia de Identificación Vehicular Morelos' },
	baseLegal: { type: String }, // Párrafo de fundamento legal
	resultadoDescripcion: { type: String }, // Texto que acompaña al resultado

	images: { type: [String], default: [] }, // URLs de imágenes asociadas (serie, motor, placas, vistas)

	createdBy: { type: String },
}, { timestamps: true });

export default mongoose.models.VehicleCertificate || mongoose.model('VehicleCertificate', VehicleCertificateSchema);
