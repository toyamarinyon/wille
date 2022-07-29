import { compose } from "./compose";
import { handler } from "./handler";
import { Middleware } from "./middleware";
import { HydrateRoutes, Routes } from "./router";

const middlewareList: Middleware[] = [];

interface Eagle {
  addMiddleware: (middleware: Middleware) => void;
  handleRequest: (request: Request) => Promise<Response>;
}
type EagleBuilder = (routes: Routes, hydrateRoutes: HydrateRoutes) => Eagle;

export const createEagle: EagleBuilder = (routes, hydrateRoutes) => {
  return {
    addMiddleware: (middleware: Middleware) => {
      middlewareList.push(middleware);
    },
    async handleRequest(request: Request) {
      const composed = compose(middlewareList);
      return await composed(
        request,
        async (req) => await handler(req, routes, hydrateRoutes, null)
      );
    },
  };
};
