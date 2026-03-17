const { app } = require('@azure/functions');
const QRCode = require('qrcode');

const DEFAULT_SIZE = 320;
const DEFAULT_MARGIN = 2;
const DEFAULT_ERROR_CORRECTION = 'M';

function clampInteger(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
        return fallback;
    }

    return Math.min(Math.max(parsed, min), max);
}

function normalizeErrorCorrectionLevel(value) {
    if (!value) {
        return DEFAULT_ERROR_CORRECTION;
    }

    const normalized = String(value).toUpperCase();
    const allowedLevels = new Set(['L', 'M', 'Q', 'H']);

    return allowedLevels.has(normalized) ? normalized : DEFAULT_ERROR_CORRECTION;
}

async function readRequestBody(request) {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        try {
            return await request.json();
        } catch {
            return {};
        }
    }

    const textBody = await request.text();
    return textBody ? { text: textBody } : {};
}

function badRequest(message) {
    return {
        status: 400,
        jsonBody: {
            error: message,
            usage: {
                get: '/api/qrcodeCreate?text=https://example.com',
                post: {
                    text: 'https://example.com',
                    size: 320,
                    margin: 2,
                    errorCorrectionLevel: 'M'
                }
            }
        }
    };
}

app.http('qrcodeCreate', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Generating QR code for "${request.url}"`);

        const body = request.method === 'POST' ? await readRequestBody(request) : {};
        const text = request.query.get('text') || body.text;

        if (!text || !String(text).trim()) {
            return badRequest('text is required.');
        }

        const size = clampInteger(request.query.get('size') || body.size, DEFAULT_SIZE, 128, 2048);
        const margin = clampInteger(request.query.get('margin') || body.margin, DEFAULT_MARGIN, 0, 10);
        const errorCorrectionLevel = normalizeErrorCorrectionLevel(
            request.query.get('errorCorrectionLevel') || body.errorCorrectionLevel
        );

        const pngBuffer = await QRCode.toBuffer(String(text), {
            type: 'png',
            width: size,
            margin,
            errorCorrectionLevel
        });

        return {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-store'
            },
            body: pngBuffer
        };
    }
});
