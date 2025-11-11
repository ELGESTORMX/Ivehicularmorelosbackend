import jwt from 'jsonwebtoken'

export default (req,res,next)=> {
    try {
        if (!process.env.SECRET_KEY) {
            const msg = 'SECRET_KEY no definido';
            if (process.env.NODE_ENV !== 'production') console.error(`[Auth] ${msg}`);
            return res.status(500).json({ success:false, message:'Config del servidor inválida' });
        }
        if (!req.user) {
            const msg = 'Usuario no establecido antes de firmar token';
            if (process.env.NODE_ENV !== 'production') console.error(`[Auth] ${msg}`);
            return res.status(500).json({ success:false, message:'Error interno' });
        }
        const payload = {
            username: req.user.username,
            _id: req.user._id,
            role: req.user.role
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn:'100y' });
        req.token = token;
        return next();
    } catch (e) {
        console.error('[Auth] Error al generar token:', e?.message || e);
        return res.status(500).json({ success:false, message:'Error interno del servidor' });
    }
}