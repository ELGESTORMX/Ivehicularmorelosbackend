import 'dotenv/config.js'//configura las variables de entorno de la aplicacion
// touch: cambio mínimo para forzar redeploy en Railway (fecha: 2025-10-14)
import "./config/db.js"
import { __dirname } from './utils.js';
import cors from 'cors'//modulo para permitir origenes cruzados(puerto del back con puerto del front)
import express from'express'; //modulo necesario para levantar y configurar un servidor
import indexRouter from'./routes/index.js';//enrutador principal de la aplicacion
import logger from'morgan';//modulo para registrar las peticiones que se reaslizan al servidor
import path from'path'; //modulo necesario para conocer la ubicaciob de nuestro servidor
import bodyParser from 'body-parser';

let app = express(); 
app.disable('etag')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// CORS abierto para todos los orígenes (replicable en distintos dominios)
const corsAll = {
  origin: '*',
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  credentials: false,
  allowedHeaders: ['Content-Type','Authorization','Accept','Origin','X-Requested-With']
};
app.use(cors(corsAll));
app.options('*', cors(corsAll));
app.use(logger('dev')); //obliga al servidor a usar el middleware de registro de peticiones
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, 'public')));//obliga al servidor a generar una carpeta de acceso PUBLICO
app.set('views', path.join(__dirname, 'views'));//configuro que las vistas generadas en el backend estan en la capeta views
app.set('view engine', 'ejs');//configuro que las listas se van a definir con el lenguaje de EJS.(moto de plantilla)
// Forzar no-caché en todas las respuestas del API para evitar ver datos stale en el frontend
app.use('/api', (req, res, next) => {
	res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	res.set('Pragma', 'no-cache');
	res.set('Expires', '0');
	next();
});
app.use('/api', indexRouter);//obliga al servidor a usar las rutas definifas en el enrutador
app.use('/uploads',express.static('uploads'))
app.use((req, res, next)=>{
console.log('Time: ', new Date().getFullYear()); //Imprimir 2023
next()});



export default app;