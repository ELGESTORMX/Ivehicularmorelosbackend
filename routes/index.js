import express from 'express'
import mongoose from 'mongoose'
import users_router from './users.js';
import vehicleCertificates_router from './vehicleCertificates.js';
let router = express.Router()

router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

// Health simple
router.get('/health', (req, res) => res.json({ ok:true, deploymentTime: new Date().toISOString() }));

// Info de DB: útil para verificar a qué base estamos conectados
router.get('/db-info', (req, res) => {
  try{
    const info = mongoose.connection;
    const name = info?.name || info?.db?.databaseName || '';
    const host = info?.host || '';
    res.json({ ok: true, dbName: name, host });
  }catch(e){
    res.status(500).json({ ok:false, error: String(e.message||e) })
  }
});

// Endpoint de diagnóstico opcional: habilitar sólo si DEBUG_DB=true
router.get('/debug/dbinfo', async (req, res) => {
  if (process.env.DEBUG_DB !== 'true') return res.status(404).json({ ok:false, message:'Not enabled' });
  try {
    const info = mongoose.connection;
    const dbName = info?.name || info?.db?.databaseName;
    const coll = await info?.db?.listCollections().toArray();
    const take = ['users','vehiclecertificates','documents'];
    const counts = {};
    for (const c of take) {
      try { counts[c] = await info.db.collection(c).countDocuments(); }
      catch { counts[c] = null; }
    }
    res.json({ ok:true, dbName, collections: coll?.map(x=>x.name), counts });
  } catch (e) {
    res.status(500).json({ ok:false, error: e?.message || String(e) });
  }
});


router.use('/users', users_router)
router.use('/vehicle-certificates', vehicleCertificates_router)
export default router