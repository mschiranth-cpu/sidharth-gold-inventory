/**
 * ============================================
 * COMPRESSION MIDDLEWARE
 * ============================================
 * 
 * Response compression for API responses:
 * - Gzip compression
 * - Brotli compression (when supported)
 * - Configurable thresholds
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import zlib from 'zlib';
import { performanceConfig } from '../config/performance.config';
import { logger } from '../utils/logger';

type CompressionEncoding = 'gzip' | 'deflate' | 'br' | 'identity';

/**
 * Parse Accept-Encoding header and return best supported encoding
 */
function getBestEncoding(acceptEncoding: string | undefined): CompressionEncoding {
  if (!acceptEncoding) return 'identity';

  // Order of preference: br > gzip > deflate
  if (acceptEncoding.includes('br')) return 'br';
  if (acceptEncoding.includes('gzip')) return 'gzip';
  if (acceptEncoding.includes('deflate')) return 'deflate';

  return 'identity';
}

/**
 * Create compressor based on encoding
 */
function createCompressor(encoding: CompressionEncoding): zlib.Gzip | zlib.Deflate | zlib.BrotliCompress | null {
  const { level } = performanceConfig.compression;

  switch (encoding) {
    case 'gzip':
      return zlib.createGzip({ level });
    case 'deflate':
      return zlib.createDeflate({ level });
    case 'br':
      return zlib.createBrotliCompress({
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: level,
        },
      });
    default:
      return null;
  }
}

/**
 * Check if response should be compressed
 */
function shouldCompress(req: Request, res: Response): boolean {
  // Check if compression is enabled
  if (!performanceConfig.compression.enabled) {
    return false;
  }

  // Check custom filter
  if (performanceConfig.compression.filter && !performanceConfig.compression.filter(req, res)) {
    return false;
  }

  // Don't compress if no-compression header is set
  if (req.headers['x-no-compression']) {
    return false;
  }

  // Check content type - only compress text-based content
  const contentType = res.get('Content-Type') || '';
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/xhtml+xml',
  ];

  const isCompressible = compressibleTypes.some((type) => contentType.includes(type));
  if (!isCompressible) {
    return false;
  }

  return true;
}

/**
 * Compression middleware
 */
export function compressionMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original write and end methods
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    let chunks: Buffer[] = [];
    let encoding: CompressionEncoding = 'identity';

    // Determine encoding early
    encoding = getBestEncoding(req.headers['accept-encoding'] as string);

    // Override write
    res.write = function (chunk: any, ...args: any[]): boolean {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return true;
    } as any;

    // Override end
    res.end = function (chunk?: any, ...args: any[]): Response {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);

      // Check if should compress
      if (!shouldCompress(req, res) || buffer.length < performanceConfig.compression.threshold) {
        // Send uncompressed
        return originalEnd(buffer);
      }

      // Compress the response
      const compressor = createCompressor(encoding);

      if (!compressor) {
        return originalEnd(buffer);
      }

      const compressedChunks: Buffer[] = [];

      compressor.on('data', (chunk: Buffer) => {
        compressedChunks.push(chunk);
      });

      compressor.on('end', () => {
        const compressed = Buffer.concat(compressedChunks);

        // Only use compression if it actually reduces size
        if (compressed.length < buffer.length) {
          res.setHeader('Content-Encoding', encoding);
          res.setHeader('Content-Length', compressed.length);
          res.setHeader('Vary', 'Accept-Encoding');
          originalEnd(compressed);
        } else {
          originalEnd(buffer);
        }
      });

      compressor.on('error', (err) => {
        logger.error('Compression error:', err);
        originalEnd(buffer);
      });

      compressor.write(buffer);
      compressor.end();

      return res;
    } as any;

    next();
  };
}

/**
 * Simple synchronous compression for known content
 */
export function compressSync(data: string | Buffer, encoding: CompressionEncoding = 'gzip'): Buffer {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

  switch (encoding) {
    case 'gzip':
      return zlib.gzipSync(buffer);
    case 'deflate':
      return zlib.deflateSync(buffer);
    case 'br':
      return zlib.brotliCompressSync(buffer);
    default:
      return buffer;
  }
}

/**
 * Decompress content
 */
export function decompressSync(data: Buffer, encoding: CompressionEncoding): Buffer {
  switch (encoding) {
    case 'gzip':
      return zlib.gunzipSync(data);
    case 'deflate':
      return zlib.inflateSync(data);
    case 'br':
      return zlib.brotliDecompressSync(data);
    default:
      return data;
  }
}

// Note: For production, consider using the 'compression' npm package
// which handles edge cases better. This is a simplified implementation.
