/**
 * Cloudflare Worker entry point for vowel documentation
 * 
 * This worker serves static files from the VitePress build output.
 * The Cloudflare Vite plugin will bundle this and configure
 * the static asset serving automatically.
 */

/**
 * Execution context provided by Cloudflare Workers runtime.
 */
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

/**
 * Fetcher interface for service bindings (like ASSETS).
 */
interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

const CROSS_ORIGIN_ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
} as const;

function withCrossOriginIsolationHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(CROSS_ORIGIN_ISOLATION_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Serve static files from the ASSETS binding
    // This is configured via [assets] in wrangler.toml
    if (!env.ASSETS) {
      return withCrossOriginIsolationHeaders(new Response('Assets binding not configured', { status: 500 }));
    }

    const url = new URL(request.url);
    
    // Try to fetch the requested asset
    let response = await env.ASSETS.fetch(request);
    
    // If the asset exists, return it
    if (response.status !== 404) {
      return withCrossOriginIsolationHeaders(response);
    }
    
    // For SPA routing: if the request is for a path (not a file), serve index.html
    // This handles VitePress client-side routing
    // Exclude known file extensions and API paths
    const pathname = url.pathname;
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
    
    if (!hasFileExtension && pathname !== '/index.html') {
      // Try to fetch index.html for SPA routing
      const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
      response = await env.ASSETS.fetch(indexRequest);
      
      if (response.status !== 404) {
        return withCrossOriginIsolationHeaders(response);
      }
    }
    
    // Return the original 404 if nothing matched
    return withCrossOriginIsolationHeaders(response);
  },
};

/**
 * Environment interface for Cloudflare Worker bindings.
 */
interface Env {
  /**
   * Assets binding for serving static files.
   * Configured automatically via wrangler.toml [assets] section.
   */
  ASSETS?: Fetcher;
}
