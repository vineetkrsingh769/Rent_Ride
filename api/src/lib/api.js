import { Router } from "express";

function apiSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
function apiError(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

const ROUTE_METHODS = ["get", "post", "put", "patch", "delete", "all"];

/**
 * Express 4 does not forward rejected promises from an async handler to the
 * error middleware — the request just hangs and the client gets no response.
 * This returns a Router whose route methods wrap every handler so a rejection
 * is passed to next(), letting the error middleware in app.js answer with 500.
 */
function createRouter() {
  const router = Router();
  for (const method of ROUTE_METHODS) {
    const original = router[method].bind(router);
    router[method] = (path, ...handlers) =>
      original(
        path,
        ...handlers.map((handler) =>
          typeof handler === "function" && handler.length < 4
            ? (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
            : handler
        )
      );
  }
  return router;
}

export {
  apiError,
  apiSuccess,
  createRouter
};
