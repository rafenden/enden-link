# Enden Link

Simple URL shortener based on Cloudflare KV and Analytics Engine.

## Prerequisites

- Cloudflare account
- Cloudflare Workers account
- Cloudflare Analytics Engine account
- Cloudflare KV account
- Wrangler installed (`brew add wrangler`)

## Development

```shell
npm i
```

```shell
npm run dev
```

## Deployment

Deployment happens with each commit to the `main` branch.

It's possible to deploy manually too:

```shell
npm run deploy
```