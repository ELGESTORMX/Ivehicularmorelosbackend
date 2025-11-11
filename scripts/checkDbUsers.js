import 'dotenv/config.js';
import mongoose from 'mongoose';
import Users from '../models/Users.js';

async function main(){
  try{
    const uri = process.env.LINK_DB;
    if(!uri){
      console.error('[DB CHECK] LINK_DB no está definido en el entorno');
      process.exit(2);
    }
    await mongoose.connect(uri, {
      readPreference: 'primary', retryWrites: true, w: 'majority', serverSelectionTimeoutMS: 10000
    });
    const conn = mongoose.connection;
    console.log('[DB CHECK] Conectado a:', {
      host: conn?.host,
      name: conn?.name, // nombre de la base de datos efectiva
      readyState: conn?.readyState
    });

    // Contar usuarios y listar algunos
    const total = await Users.countDocuments({});
    const sample = await Users.find({}, { username: 1, role: 1, active: 1 }).limit(10).lean();
    console.log('[DB CHECK] Usuarios totales:', total);
    console.log('[DB CHECK] Muestra (username, role, active):', sample.map(u=>({ username:u.username, role:u.role, active:u.active })));

    await mongoose.disconnect();
    process.exit(0);
  }catch(e){
    console.error('[DB CHECK] Error:', e?.message || e);
    process.exit(1);
  }
}

main();
