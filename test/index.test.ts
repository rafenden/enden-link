import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker, { Env } from '../src/index';
import { ExecutionContext } from '@cloudflare/workers-types';

type MockKVNamespace = ReturnType<typeof createMockKVNamespace>;
type MockContext = ReturnType<typeof createMockExecutionContext>;

class MockRequest {
  url: string;
  headers: Headers;
  cf: Record<string, any>;

  constructor(url: string, options: { headers?: HeadersInit } = {}) {
    this.url = url;
    this.headers = new Headers(options.headers || {});
    this.cf = {};
  }
}

const USER_AGENTS = {
  SAFARI:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  BOT: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

const BASE_URL = 'https://link.enden.com';

const createMockKVNamespace = () => {
  const store: Record<string, string> = {};
  return {
    get: vi.fn((key: string) => Promise.resolve(store[key] || null)),
    put: vi.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    delete: vi.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  };
};

const createMockAnalyticsDataset = () => ({
  writeDataPoint: vi.fn(() => Promise.resolve()),
});

const createMockExecutionContext = () => ({
  waitUntil: vi.fn((promise: Promise<any>) => promise),
  passThroughOnException: vi.fn(),
});

const createRequestWithCf = (
  url: string,
  options: {
    userAgent?: string;
    headers?: Record<string, string>;
    cfData?: Record<string, any>;
  } = {},
) => {
  const { userAgent = USER_AGENTS.SAFARI, headers = {}, cfData = {} } = options;

  const allHeaders = {
    'user-agent': userAgent,
    ...headers,
  };

  const request = new MockRequest(url, { headers: allHeaders });
  request.cf = {
    city: 'San Francisco',
    country: 'US',
    ...cfData,
  };

  return request;
};

vi.stubGlobal('Request', MockRequest);

describe('URL Shortener Worker', () => {
  let env: Env;
  let ctx: ExecutionContext;
  let mockKV: MockKVNamespace;
  let mockCtx: MockContext;

  beforeEach(() => {
    mockKV = createMockKVNamespace();

    env = {
      BASE_URL,
      ENDEN_LINK_URLS: mockKV,
      ENDEN_LINK_VIEWS: createMockAnalyticsDataset(),
    };

    ctx = createMockExecutionContext();
    mockCtx = ctx as MockContext;

    vi.clearAllMocks();
  });

  it('should redirect to BASE_URL when no slug is provided', async () => {
    const request = createRequestWithCf(`${BASE_URL}/`);

    const response = await worker.fetch(request as any, env, ctx);

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(BASE_URL + '/');
  });

  it('should redirect to the destination URL when a valid slug is provided', async () => {
    const destinationUrl = 'https://example.com';
    mockKV.get.mockResolvedValueOnce(`url: ${destinationUrl}`);
    const request = createRequestWithCf(`${BASE_URL}/example`);

    const response = await worker.fetch(request as any, env, ctx);

    expect(mockKV.get).toHaveBeenCalledWith('example');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(destinationUrl + '/');
  });

  it('should return 404 when slug is not found', async () => {
    mockKV.get.mockResolvedValueOnce(null);
    const request = createRequestWithCf(`${BASE_URL}/nonexistent`);

    const response = await worker.fetch(request as any, env, ctx);

    expect(mockKV.get).toHaveBeenCalledWith('nonexistent');
    expect(response.status).toBe(404);
  });

  describe('Analytics tracking', () => {
    const destinationUrl = 'https://example.com';

    it('should track analytics for valid slugs with a browser', async () => {
      mockKV.get.mockResolvedValueOnce(`url: ${destinationUrl}`);

      const request = createRequestWithCf(`${BASE_URL}/example`, {
        userAgent: USER_AGENTS.SAFARI,
        headers: { referer: 'https://google.com' },
      });

      await worker.fetch(request as any, env, ctx);

      expect(env.ENDEN_LINK_VIEWS.writeDataPoint).toHaveBeenCalledWith({
        blobs: [
          'example',
          destinationUrl,
          'https://google.com',
          'San Francisco',
          'US',
          USER_AGENTS.SAFARI,
          'Mobile Safari',
          '14.0',
          'Apple',
          'iPhone',
          'iOS',
          '14.6',
        ],
        doubles: [],
        indexes: ['example'],
      });
    });

    it('should not track analytics for bot user agents', async () => {
      mockKV.get.mockResolvedValueOnce(`url: ${destinationUrl}`);

      const request = createRequestWithCf(`${BASE_URL}/example`, {
        userAgent: USER_AGENTS.BOT,
      });

      await worker.fetch(request as any, env, ctx);

      expect(env.ENDEN_LINK_VIEWS.writeDataPoint).not.toHaveBeenCalled();
    });

    it('should not track links for targets with tracking disabled', async () => {
      mockKV.get.mockResolvedValueOnce(
        `{url: ${destinationUrl}, track: false}`,
      );

      const request = createRequestWithCf(`${BASE_URL}/_admin`);

      await worker.fetch(request as any, env, ctx);

      expect(env.ENDEN_LINK_VIEWS.writeDataPoint).not.toHaveBeenCalled();
    });
  });
});
