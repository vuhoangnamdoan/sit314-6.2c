// respond.js
// A single, standard shape for every HTTP response, so clients always get the
// same fields: the status code, an optional data payload, and the server time.

function send(res, status, data) {
  res.status(status).json({
    status,
    data: data === undefined ? null : data,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { send };
