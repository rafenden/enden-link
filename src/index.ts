export interface Env {
  // @ts-ignore
  ENDEN_LINK_URLS: KVNamespace;
  // @ts-ignore
  ENDEN_LINK_VIEWS: AnalyticsEngine;
}

export default {
  // @ts-ignore
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    // @ts-ignore
    const slug = pathname.startsWith("/") ? pathname.slice(1) : pathname;

    if (!slug) {
      return Response.redirect('https://enden.com', 302);
    }

    const dest = await env.ENDEN_LINK_URLS.get(slug);
    if (!dest) {
      return new Response(`No URL mapped for ‘${slug}’.`, { status: 404 });
    }

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