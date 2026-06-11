const svc = require('./catalogoItems.service');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize } = require('../../Middlewares/rbac.middleware');

// Crea un router de catálogo (búsqueda + CRUD) para una categoría fija de catalogo_items
module.exports = (categoria) => {
  const router = require('express').Router();

  router.use(authenticate);

  // Búsqueda abierta a todos los roles (Directores Técnicos usan esto en la recepción)
  router.get('/buscar', async (req, res, next) => {
    try {
      const q = (req.query.q || '').trim();
      if (!q) return res.json({ success: true, data: [] });
      const data = await svc.search(q, req.user.empresa_id, categoria);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.get('/', async (req, res, next) => {
    try {
      const data = await svc.findAll(req.user.empresa_id, categoria);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const data = await svc.findById(Number(req.params.id), req.user.empresa_id, categoria);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  // Solo ADMIN puede gestionar el catálogo
  router.post('/', authorize('ADMIN'), async (req, res, next) => {
    try {
      const data = await svc.create(req.body, req.user.empresa_id, categoria);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
    try {
      const data = await svc.update(Number(req.params.id), req.body, req.user.empresa_id, categoria);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
    try {
      await svc.softDelete(Number(req.params.id), req.user.empresa_id, categoria);
      res.json({ success: true });
    } catch (err) { next(err); }
  });

  return router;
};
