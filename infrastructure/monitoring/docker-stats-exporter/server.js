// Minimal Docker Stats → Prometheus Exporter
// Uses only the Docker socket (no filesystem mounts needed).
// Emits the same metric names as cAdvisor so existing Grafana dashboards work.

'use strict';

const http = require('http');

const PORT = 9338;
const COLLECT_INTERVAL_MS = 15_000;

let cachedMetrics = '# waiting for first collection...\n';

// ── Docker socket helper ──────────────────────────────────────────────────────

function dockerGet(path) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            { socketPath: '/var/run/docker.sock', path, method: 'GET' },
            (res) => {
                let raw = '';
                res.on('data', (c) => (raw += c));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(raw));
                    } catch (e) {
                        reject(new Error(`JSON parse error for ${path}: ${raw.slice(0, 200)}`));
                    }
                });
            }
        );
        req.on('error', reject);
        req.end();
    });
}

// ── Metrics collection ────────────────────────────────────────────────────────

async function collectAll() {
    const containers = await dockerGet('/containers/json');
    if (!Array.isArray(containers) || containers.length === 0) return [];

    // Fetch stats in parallel for speed (one-shot avoids the 1 s wait in older daemons)
    const results = await Promise.all(
        containers.map(async (c) => {
            const name = (c.Names[0] || '').replace(/^\//, '');
            const image = c.Image || '';
            try {
                const s = await dockerGet(
                    `/containers/${c.Id}/stats?stream=false&one-shot=true`
                );

                // CPU – cumulative nanoseconds → seconds (counter)
                const cpuNs = s.cpu_stats?.cpu_usage?.total_usage ?? 0;
                const cpuSeconds = cpuNs / 1e9;

                // Memory – working set = usage - inactive_file (cache)
                const usage = s.memory_stats?.usage ?? 0;
                const cache =
                    s.memory_stats?.stats?.inactive_file ??
                    s.memory_stats?.stats?.cache ??
                    0;
                const memBytes = Math.max(0, usage - cache);

                // Network I/O – sum across all interfaces
                let rxBytes = 0;
                let txBytes = 0;
                if (s.networks) {
                    for (const iface of Object.values(s.networks)) {
                        rxBytes += iface.rx_bytes ?? 0;
                        txBytes += iface.tx_bytes ?? 0;
                    }
                }

                // Block I/O
                let blkRead = 0;
                let blkWrite = 0;
                for (const entry of s.blkio_stats?.io_service_bytes_recursive ?? []) {
                    if (entry.op === 'read') blkRead += entry.value;
                    else if (entry.op === 'write') blkWrite += entry.value;
                }

                return { name, image, cpuSeconds, memBytes, rxBytes, txBytes, blkRead, blkWrite };
            } catch (e) {
                console.error(`stats error for ${name}: ${e.message}`);
                return null;
            }
        })
    );

    return results.filter(Boolean);
}

// ── Prometheus text format ────────────────────────────────────────────────────

function buildMetrics(data) {
    const lines = [];

    function gauge(metric, help, fn) {
        lines.push(`# HELP ${metric} ${help}`);
        lines.push(`# TYPE ${metric} gauge`);
        for (const d of data) {
            lines.push(
                `${metric}{name="${d.name}",image="${d.image}"} ${fn(d)}`
            );
        }
    }

    function counter(metric, help, fn) {
        lines.push(`# HELP ${metric} ${help}`);
        lines.push(`# TYPE ${metric} counter`);
        for (const d of data) {
            lines.push(
                `${metric}{name="${d.name}",image="${d.image}"} ${fn(d)}`
            );
        }
    }

    counter(
        'container_cpu_usage_seconds_total',
        'Cumulative cpu time consumed in seconds.',
        (d) => d.cpuSeconds
    );
    gauge(
        'container_memory_working_set_bytes',
        'Current working set in bytes.',
        (d) => d.memBytes
    );
    counter(
        'container_network_receive_bytes_total',
        'Cumulative count of bytes received.',
        (d) => d.rxBytes
    );
    counter(
        'container_network_transmit_bytes_total',
        'Cumulative count of bytes transmitted.',
        (d) => d.txBytes
    );
    counter(
        'container_fs_reads_bytes_total',
        'Cumulative count of bytes read from disk.',
        (d) => d.blkRead
    );
    counter(
        'container_fs_writes_bytes_total',
        'Cumulative count of bytes written to disk.',
        (d) => d.blkWrite
    );

    return lines.join('\n') + '\n';
}

// ── Refresh loop ──────────────────────────────────────────────────────────────

async function refresh() {
    try {
        const data = await collectAll();
        cachedMetrics = buildMetrics(data);
        console.log(`[${new Date().toISOString()}] Collected metrics for ${data.length} containers`);
    } catch (e) {
        console.error(`Collection failed: ${e.message}`);
    }
}

refresh(); // first run immediately
setInterval(refresh, COLLECT_INTERVAL_MS);

// ── HTTP server ───────────────────────────────────────────────────────────────

http
    .createServer((req, res) => {
        if (req.url === '/metrics' || req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
            res.end(cachedMetrics);
        } else if (req.url === '/health') {
            res.writeHead(200);
            res.end('ok');
        } else {
            res.writeHead(404);
            res.end();
        }
    })
    .listen(PORT, () => console.log(`docker-stats-exporter listening on :${PORT}`));
