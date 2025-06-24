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

    ctx.waitUntil(
      env.ENDEN_LINK_VIEWS.writeDataPoint({
        doubles: [1],
        blobs: [
          slug,
          dest,
          request.headers.get('user-agent'),
          // @ts-ignore
          request.cf?.country,
        ],
        indexes: [slug],
      })
    );

    return Response.redirect(dest, 301);
  },
};