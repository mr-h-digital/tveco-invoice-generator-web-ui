import http from 'node:http';

const port = Number(process.env.TRACKING_STUB_PORT || 8787);
const secret = process.env.TRACKING_STUB_SECRET || '';

const sampleJobsByToken = {
  'TVC-9A1F0C': {
    id: 'job-001',
    jobNumber: 'TVECO-EXP-2026-001',
    publicTrackingToken: 'TVC-9A1F0C',
    status: 'SHIPPING',
    destinationCountry: 'Zambia',
    vehicleDescription: 'Toyota Land Cruiser 200 Series',
    estimatedArrivalDate: '2026-07-05',
    milestones: [
      { key: 'enquiry', label: 'Enquiry Received', completedAt: '2026-06-01T08:00:00.000Z' },
      { key: 'sourcing', label: 'Vehicle Sourcing', completedAt: '2026-06-03T10:20:00.000Z' },
      { key: 'documentation', label: 'Export Documentation', completedAt: '2026-06-09T11:30:00.000Z' },
      { key: 'shipping', label: 'Shipping in Progress', completedAt: '2026-06-12T13:00:00.000Z' },
      { key: 'delivery', label: 'Delivered', completedAt: null },
    ],
    paymentMilestones: [
      { key: 'deposit', label: 'Deposit (30%)', amount: 15810, dueDate: '2026-06-01', paid: true, paidAt: '2026-06-02T08:00:00.000Z' },
      { key: 'shipping', label: 'Shipping Payment (40%)', amount: 21080, dueDate: '2026-06-11', paid: true, paidAt: '2026-06-11T14:00:00.000Z' },
      { key: 'balance', label: 'Final Balance (30%)', amount: 15810, dueDate: '2026-06-29', paid: false, paidAt: null },
    ],
    clientSnapshot: {
      companyName: 'Kabila Muteba Enterprises',
      contactName: 'Kabila Muteba',
      email: 'kabila@example.zm',
      phone: '+260 97 000 0001',
    },
  },
  'TVC-DEMO01': {
    id: 'job-002',
    jobNumber: 'TVECO-EXP-2026-002',
    publicTrackingToken: 'TVC-DEMO01',
    status: 'DOCUMENTATION',
    destinationCountry: 'Botswana',
    vehicleDescription: 'Toyota Hilux 2.8 GD-6',
    estimatedArrivalDate: '2026-07-20',
    milestones: [
      { key: 'enquiry', label: 'Enquiry Received', completedAt: '2026-06-15T08:00:00.000Z' },
      { key: 'sourcing', label: 'Vehicle Sourcing', completedAt: '2026-06-18T11:00:00.000Z' },
      { key: 'documentation', label: 'Export Documentation', completedAt: null },
    ],
    paymentMilestones: [
      { key: 'deposit', label: 'Deposit (30%)', amount: 12600, dueDate: '2026-06-16', paid: true, paidAt: '2026-06-16T09:10:00.000Z' },
      { key: 'shipping', label: 'Shipping Payment (40%)', amount: 16800, dueDate: '2026-06-28', paid: false, paidAt: null },
      { key: 'balance', label: 'Final Balance (30%)', amount: 12600, dueDate: '2026-07-08', paid: false, paidAt: null },
    ],
    clientSnapshot: {
      companyName: 'Makgosi Motors',
      contactName: 'Tshepo Molefe',
      email: 'tshepo@example.co.bw',
      phone: '+267 71 000 000',
    },
  },
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-tveco-tracking-secret',
  });
  res.end(JSON.stringify(body));
}

function normalizeToken(input) {
  return typeof input === 'string' ? input.trim().toUpperCase() : '';
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (!req.url || (req.url !== '/' && req.url !== '/track')) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (secret) {
    const incoming = req.headers['x-tveco-tracking-secret'];
    if (incoming !== secret) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }
  }

  let body = '';
  req.on('data', (chunk) => {
    body += String(chunk);
  });

  req.on('end', () => {
    try {
      const parsed = body ? JSON.parse(body) : {};
      const token = normalizeToken(parsed.token);

      if (!token) {
        sendJson(res, 400, { error: 'token is required' });
        return;
      }

      const job = sampleJobsByToken[token];
      if (!job) {
        sendJson(res, 404, { error: `No tracking record for token ${token}` });
        return;
      }

      sendJson(res, 200, { job });
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON payload' });
    }
  });
});

server.listen(port, () => {
  console.log(`[tracking-stub] listening on http://localhost:${port}`);
  console.log('[tracking-stub] endpoint: POST /track');
  console.log('[tracking-stub] sample tokens: TVC-9A1F0C, TVC-DEMO01');
  if (secret) {
    console.log('[tracking-stub] secret check enabled via TRACKING_STUB_SECRET');
  }
});
