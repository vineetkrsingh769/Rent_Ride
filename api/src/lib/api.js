function apiSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
function apiError(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}
export {
  apiError,
  apiSuccess
};
