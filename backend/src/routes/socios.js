const express = require('express');
const { requireRole } = require('../auth');
const {
  getAllSocios,
  getSocioById,
  createSocio,
  updateSocio,
  updateEstadoSocio,
  updatePagoSocio,
  deleteSocio
} = require('../services/socioService');

const router = express.Router();
const readAccess = requireRole(['usuario', 'admin', 'superadmin']);
const writeAccess = requireRole(['admin', 'superadmin']);

router.get('/', readAccess, async (req, res, next) => {
  try {
    const socios = await getAllSocios();
    res.json(socios);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', readAccess, async (req, res, next) => {
  try {
    const socio = await getSocioById(req.params.id);
    res.json(socio);
  } catch (error) {
    next(error);
  }
});

router.post('/', writeAccess, async (req, res, next) => {
  try {
    const nuevoSocio = await createSocio(req.body);
    res.status(201).json(nuevoSocio);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', writeAccess, async (req, res, next) => {
  try {
    const socioActualizado = await updateSocio(req.params.id, req.body);
    res.json(socioActualizado);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/estado', writeAccess, async (req, res, next) => {
  try {
    const socioActualizado = await updateEstadoSocio(req.params.id, req.body);
    res.json(socioActualizado);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/pago', writeAccess, async (req, res, next) => {
  try {
    const socioActualizado = await updatePagoSocio(req.params.id);
    res.json(socioActualizado);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', writeAccess, async (req, res, next) => {
  try {
    const resultado = await deleteSocio(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
