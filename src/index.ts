export interface Env {
  BASE_URL: string;
  // @ts-ignore
  ENDEN_LINK_URLS: KVNamespace;
  // @ts-ignore
  ENDEN_LINK_VIEWS: AnalyticsEngine;
}

export default {
  // @ts-ignore
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    const slug = pathname.slice(1);
    const dest = slug.length > 0
      ? (await env.ENDEN_LINK_URLS.get(slug) ?? env.BASE_URL)
      : env.BASE_URL;

    // @ts-ignore
    const cfProperties = request.cf;

    ctx.waitUntil(
      env.ENDEN_LINK_VIEWS.writeDataPoint({
        blobs: [
          slug,
          dest,
          request.headers.get('user-agent'),
          request.headers.get('referer'),
          cfProperties.city as string,
          cfProperties.country as string,
          cfProperties.continent as string,
          cfProperties.region as string,
          cfProperties.regionCode as string,
          cfProperties.timezone as string,
        ],
        doubles: [cfProperties.metroCode as number, cfProperties.longitude as number, cfProperties.latitude as number],
        indexes: [slug],
      })
    );

    return Response.redirect(dest, 301);
  },
};
