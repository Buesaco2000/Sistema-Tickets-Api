const router   = require('express').Router();
const svc      = require('./conteoFisico.service');
const AppError = require('../../Utils/AppError');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const ROLES            = require('../../Utils/roles');

router.use(authenticate);

const ADMIN_SALUD = [ROLES.ADMIN, ROLES.SALUD];

const esPrivilegiado = (user) => {
  const c = (user.cargo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return user.rol_id === ROLES.ADMIN || c.includes('almacen') || c.includes('director');
};

router.get('/', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    const data = await svc.listar(req.user.empresa_id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    if (!esPrivilegiado(req.user)) throw new AppError('Solo ADMIN o Almacén puede crear conteos.', 403);
    const data = await svc.crear(req.body, req.user.id, req.user.empresa_id);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/:id', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    const data = await svc.getById(Number(req.params.id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.patch('/:id/items', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    if (!esPrivilegiado(req.user)) throw new AppError('No tienes permiso para editar este conteo.', 403);
    await svc.actualizarItems(Number(req.params.id), req.body.items ?? [], req.user.empresa_id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.post('/:id/cerrar', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    if (!esPrivilegiado(req.user)) throw new AppError('Solo ADMIN o Almacén puede cerrar conteos.', 403);
    const { crearAjustes = false } = req.body;
    const data = await svc.cerrar(Number(req.params.id), crearAjustes, req.user.id, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── Hallazgos ──────────────────────────────────────────────────────────────

router.get('/:id/hallazgos', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    const data = await svc.getHallazgos(Number(req.params.id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/:id/hallazgos', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    if (!esPrivilegiado(req.user)) throw new AppError('Solo ADMIN o Almacén puede registrar hallazgos.', 403);
    const data = await svc.agregarHallazgo(Number(req.params.id), req.body, req.user.empresa_id);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

router.delete('/:id/hallazgos/:hallazgoId', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    if (!esPrivilegiado(req.user)) throw new AppError('Solo ADMIN o Almacén puede eliminar hallazgos.', 403);
    await svc.eliminarHallazgo(Number(req.params.id), Number(req.params.hallazgoId), req.user.empresa_id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.get('/:id/reporte', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    const conteo  = await svc.getById(Number(req.params.id), req.user.empresa_id);
    const { formato = 'xlsx' } = req.query;
    if (formato !== 'xlsx') throw new AppError('Formato no soportado. Use ?formato=xlsx', 400);

    const XLSX = require('xlsx');
    const TIPO_LABEL = {
      MEDICAMENTOS: 'Medicamentos', LABORATORIO: 'Laboratorio',
      MEDICO_QUIRURGICO: 'Méd. Quirúrgico', ASEO_PAPELERIA: 'Aseo y Papelería',
      ODONTOLOGIA: 'Odontología',
    };
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';
    const fmtDif  = (d) => d == null ? '—' : d > 0 ? `+${d}` : String(d);

    // ── Hoja 1: ítems ──────────────────────────────────────────────────────
    const filas = conteo.items.map((it, i) => ({
      '#':              i + 1,
      'Categoría':      TIPO_LABEL[it.tipo_recepcion] ?? it.tipo_recepcion,
      'Código':         it.codigo_interno   ?? '—',
      'Nombre':         it.nombre,
      'Lote':           it.lote             ?? '—',
      'Vencimiento':    fmtDate(it.fecha_vencimiento),
      'Presentación':   it.presentacion_comercial ?? '—',
      'Concentración':  it.concentracion    ?? '—',
      'Proveedor':      it.proveedor        ?? '—',
      'Stock sistema':  Number(it.stock_sistema),
      'Cant. contada':  it.cantidad_contada != null ? Number(it.cantidad_contada) : '—',
      'Diferencia':     fmtDif(it.diferencia ?? null),
      'Estado':         it.estado,
      'Observación':    it.observacion      ?? '—',
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    ws['!cols'] = [
      {wch:4},{wch:16},{wch:12},{wch:40},{wch:14},{wch:12},
      {wch:22},{wch:16},{wch:24},{wch:14},{wch:14},{wch:12},{wch:12},{wch:34},
    ];

    // ── Hoja 2: resumen ────────────────────────────────────────────────────
    const items = conteo.items;
    const resumen = [
      ['CONTEO FÍSICO', `#${conteo.id}`],
      ['Fecha',         fmtDate(conteo.fecha)],
      ['Municipio',     conteo.municipio  ?? 'Todos'],
      ['Sede',          conteo.sede       ?? 'Todas'],
      ['Estado',        conteo.estado],
      ['Creado por',    conteo.creado_por],
      ['Cerrado por',   conteo.cerrado_por ?? '—'],
      ['Fecha cierre',  fmtDate(conteo.closed_at)],
      [],
      ['RESUMEN',       ''],
      ['Total ítems',   items.length],
      ['Cuadrados',     items.filter(i => i.estado === 'CUADRADO').length],
      ['Faltantes',     items.filter(i => i.estado === 'FALTANTE').length],
      ['Sobrantes',     items.filter(i => i.estado === 'SOBRANTE').length],
      ['Pendientes',    items.filter(i => i.estado === 'PENDIENTE').length],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(resumen);
    wsInfo['!cols'] = [{wch:16},{wch:30}];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws,     'Ítems');
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Resumen');

    const buf   = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="conteo_${conteo.id}_${fecha}.xlsx"`);
    res.send(buf);
  } catch (e) { next(e); }
});

module.exports = router;
