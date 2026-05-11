const success = (res, data = null, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const paginated = (res, data, meta) =>
  res.status(200).json({ success: true, message: 'OK', data, pagination: meta });

module.exports = { success, paginated };