import mongoose, { connect } from 'mongoose'

const LINK = process.env.LINK_DB;
const isProd = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
if (!LINK) {
    console.error('\nERROR: la variable de entorno LINK_DB no está definida.\n' +
        'Define LINK_DB con la cadena de conexión de MongoDB Atlas en el entorno (Railway -> Variables).\n');
    throw new Error('Missing environment variable: LINK_DB');
}

function connectWithRetry() {
    const dbName = process.env.DB_NAME && process.env.DB_NAME.trim() ? process.env.DB_NAME.trim() : undefined;
    return connect(LINK, {
    // Forzar base de datos si no viene en el URI
    ...(dbName ? { dbName } : {}),
    // Preferir primario para lecturas y escrituras
    readPreference: 'primary',
    // Reintentos de escritura en clústeres que lo soportan
    retryWrites: true,
    // Asegurar escrituras reconocidas
    w: 'majority',
    wtimeoutMS: 5000,
    serverSelectionTimeoutMS: 10000
    })                        //conecto con el link de la db guardado en la variable de entorno del archivo .env
            .then(()=>console.log('connected to db'))       //devuelve una promesa por lo que es necesario configurar
            .catch(err=>{
                    console.error('\nERROR: No fue posible conectar a MongoDB Atlas. Revisa:\n' +
                        '  - Que la variable LINK_DB tenga la cadena correcta.\n' +
                        '  - Que el IP/Range de tu entorno esté autorizado en Atlas (Network Access -> Add IP Address).\n' +
                        "  - Para pruebas, puedes usar 0.0.0.0/0 (no recomendado en producción).\n\n");
                    console.error(err);
                    if (process.env.DB_FAIL_FAST === 'true') {
                        // Solo salir si se pide explícitamente
                        console.error('[DB] Saliendo por DB_FAIL_FAST=true');
                        process.exit(1);
                    } else {
                        // En desarrollo, no tumbar el servidor; reintentar con backoff exponencial simple
                        const delay = Number(process.env.DB_RETRY_MS || 5000);
                        console.warn(`[DB] Reintentando conexión en ${delay}ms...`);
                        setTimeout(connectWithRetry, delay);
                    }
            })                   //then y catch
}

// Intentar conexión inicial
connectWithRetry();

// Logs útiles del estado de conexión
mongoose.connection.on('connected', () => {
    const info = mongoose.connection;
    const name = info?.name || info?.db?.databaseName || '(desconocida)';
    const host = info?.host || info?.client?.s?.options?.hosts?.[0]?.host || '(host)';
    console.log(`[DB] connected -> db: ${name} on ${host}`);
}); 
mongoose.connection.on('error', (e) => console.error('[DB] error', e?.message || e));
mongoose.connection.on('disconnected', () => console.warn('[DB] disconnected'));
// touch: cambio mínimo para redeploy 2025-10-14