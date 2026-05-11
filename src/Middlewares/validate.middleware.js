// Valida body/query/params contra un schema Zod.
// Los errores los captura el error handler global.
const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.parse({
      body:   req.body,
      query:  req.query,
      params: req.params,
    });
    if (result.body)   req.body   = result.body;
    if (result.query)  req.query  = result.query;
    if (result.params) req.params = result.params;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;