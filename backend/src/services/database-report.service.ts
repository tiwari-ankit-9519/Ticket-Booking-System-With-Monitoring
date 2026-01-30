// src/services/database-report.service.ts
import { prisma } from "../config/database.config";
import { logger } from "../config/logger.config";

export interface DatabasePerformanceReport {
  timestamp: Date;
  connectionStats: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  databaseSize: {
    totalSize: string;
    tableCount: number;
    indexCount: number;
  };
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    totalSize: string;
    indexSize: string;
  }>;
  slowQueries: Array<{
    query: string;
    calls: number;
    totalTime: number;
    avgTime: number;
    maxTime: number;
  }>;
  indexUsage: Array<{
    tableName: string;
    indexName: string;
    scans: number;
    tuplesFetched: number;
  }>;
  cacheHitRate: {
    rate: number;
    heapBlocksRead: number;
    heapBlocksHit: number;
  };
  topTables: Array<{
    tableName: string;
    seqScans: number;
    seqTupleRead: number;
    indexScans: number;
    indexTuplesFetch: number;
  }>;
  locks: Array<{
    lockType: string;
    relation: string;
    mode: string;
    granted: boolean;
  }>;
  recommendations: string[];
}

export async function generatePerformanceReport(): Promise<DatabasePerformanceReport> {
  try {
    const [
      connectionStats,
      databaseSize,
      tableStats,
      slowQueries,
      indexUsage,
      cacheHitRate,
      topTables,
      locks,
    ] = await Promise.all([
      getConnectionStats(),
      getDatabaseSize(),
      getTableStats(),
      getSlowQueries(),
      getIndexUsage(),
      getCacheHitRate(),
      getTopTables(),
      getCurrentLocks(),
    ]);

    const recommendations = generateRecommendations({
      cacheHitRate,
      slowQueries,
      indexUsage,
      topTables,
    });

    return {
      timestamp: new Date(),
      connectionStats,
      databaseSize,
      tableStats,
      slowQueries,
      indexUsage,
      cacheHitRate,
      topTables,
      locks,
      recommendations,
    };
  } catch (error: any) {
    logger.error("Failed to generate performance report", {
      error: error.message,
    });
    throw error;
  }
}

async function getConnectionStats() {
  const result = await prisma.$queryRaw<
    Array<{
      total: bigint;
      active: bigint;
      idle: bigint;
      waiting: bigint;
    }>
  >`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE state = 'active') as active,
      COUNT(*) FILTER (WHERE state = 'idle') as idle,
      COUNT(*) FILTER (WHERE state = 'idle in transaction') as waiting
    FROM pg_stat_activity
    WHERE datname = current_database()
  `;

  return {
    total: Number(result[0].total),
    active: Number(result[0].active),
    idle: Number(result[0].idle),
    waiting: Number(result[0].waiting),
  };
}

async function getDatabaseSize() {
  const [sizeResult, tableCount, indexCount] = await Promise.all([
    prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
    `,
  ]);

  return {
    totalSize: sizeResult[0].size,
    tableCount: Number(tableCount[0].count),
    indexCount: Number(indexCount[0].count),
  };
}

async function getTableStats() {
  const result = await prisma.$queryRaw<
    Array<{
      table_name: string;
      row_count: bigint;
      total_size: string;
      index_size: string;
    }>
  >`
    SELECT
      relname as table_name,
      n_live_tup as row_count,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      pg_size_pretty(pg_indexes_size(relid)) as index_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 10
  `;

  return result.map((row) => ({
    tableName: row.table_name,
    rowCount: Number(row.row_count),
    totalSize: row.total_size,
    indexSize: row.index_size,
  }));
}

async function getSlowQueries() {
  try {
    const result = await prisma.$queryRaw<
      Array<{
        query: string;
        calls: bigint;
        total_time: number;
        mean_time: number;
        max_time: number;
      }>
    >`
      SELECT
        query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        max_exec_time as max_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `;

    return result.map((row) => ({
      query: row.query.substring(0, 200),
      calls: Number(row.calls),
      totalTime: row.total_time,
      avgTime: row.mean_time,
      maxTime: row.max_time,
    }));
  } catch (error) {
    logger.warn("pg_stat_statements extension not available");
    return [];
  }
}

async function getIndexUsage() {
  const result = await prisma.$queryRaw<
    Array<{
      table_name: string;
      index_name: string;
      idx_scan: bigint;
      idx_tup_fetch: bigint;
    }>
  >`
    SELECT
      schemaname || '.' || tablename as table_name,
      indexname as index_name,
      idx_scan,
      idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE idx_scan > 0
    ORDER BY idx_scan DESC
    LIMIT 20
  `;

  return result.map((row) => ({
    tableName: row.table_name,
    indexName: row.index_name,
    scans: Number(row.idx_scan),
    tuplesFetched: Number(row.idx_tup_fetch),
  }));
}

async function getCacheHitRate() {
  const result = await prisma.$queryRaw<
    Array<{
      heap_blks_read: bigint;
      heap_blks_hit: bigint;
    }>
  >`
    SELECT
      SUM(heap_blks_read) as heap_blks_read,
      SUM(heap_blks_hit) as heap_blks_hit
    FROM pg_statio_user_tables
  `;

  const heapBlocksRead = Number(result[0].heap_blks_read);
  const heapBlocksHit = Number(result[0].heap_blks_hit);
  const total = heapBlocksRead + heapBlocksHit;

  return {
    rate: total > 0 ? (heapBlocksHit / total) * 100 : 0,
    heapBlocksRead,
    heapBlocksHit,
  };
}

async function getTopTables() {
  const result = await prisma.$queryRaw<
    Array<{
      table_name: string;
      seq_scan: bigint;
      seq_tup_read: bigint;
      idx_scan: bigint;
      idx_tup_fetch: bigint;
    }>
  >`SELECT
      relname as table_name,
      seq_scan,
      seq_tup_read,
      COALESCE(idx_scan, 0) as idx_scan,
      COALESCE(idx_tup_fetch, 0) as idx_tup_fetch
    FROM pg_stat_user_tables
    ORDER BY seq_scan DESC
    LIMIT 10
  `;

  return result.map((row) => ({
    tableName: row.table_name,
    seqScans: Number(row.seq_scan),
    seqTupleRead: Number(row.seq_tup_read),
    indexScans: Number(row.idx_scan),
    indexTuplesFetch: Number(row.idx_tup_fetch),
  }));
}

async function getCurrentLocks() {
  const result = await prisma.$queryRaw<
    Array<{
      locktype: string;
      relation: string;
      mode: string;
      granted: boolean;
    }>
  >`
    SELECT
      locktype,
      COALESCE(relation::regclass::text, 'N/A') as relation,
      mode,
      granted
    FROM pg_locks
    WHERE pid != pg_backend_pid()
    LIMIT 20
  `;

  return result.map((row) => ({
    lockType: row.locktype,
    relation: row.relation,
    mode: row.mode,
    granted: row.granted,
  }));
}

function generateRecommendations(data: any): string[] {
  const recommendations: string[] = [];

  if (data.cacheHitRate.rate < 90) {
    recommendations.push(
      `⚠️ Cache hit rate is ${data.cacheHitRate.rate.toFixed(2)}%. Consider increasing shared_buffers in PostgreSQL config.`,
    );
  }

  if (data.slowQueries.length > 0) {
    recommendations.push(
      `⚠️ ${data.slowQueries.length} slow queries detected. Review and optimize these queries.`,
    );
  }

  const tablesWithoutIndexes = data.topTables.filter(
    (table: any) => table.seqScans > table.indexScans && table.seqScans > 1000,
  );

  if (tablesWithoutIndexes.length > 0) {
    recommendations.push(
      `⚠️ Tables ${tablesWithoutIndexes.map((t: any) => t.tableName).join(", ")} are using sequential scans heavily. Consider adding indexes.`,
    );
  }

  const unusedIndexes = data.indexUsage.filter(
    (index: any) => index.scans < 100,
  );

  if (unusedIndexes.length > 0) {
    recommendations.push(
      `⚠️ ${unusedIndexes.length} indexes have low usage. Consider dropping them to save space.`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Database performance looks good!");
  }

  return recommendations;
}

export async function generateHTMLReport(): Promise<string> {
  const report = await generatePerformanceReport();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Performance Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 10px; }
        .timestamp { color: #666; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; }
        .card h2 { color: #333; font-size: 18px; margin-bottom: 15px; }
        .stat { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .stat-label { color: #666; }
        .stat-value { font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #4CAF50; color: white; }
        tr:hover { background: #f5f5f5; }
        .recommendations { background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; }
        .recommendations h2 { color: #856404; margin-bottom: 15px; }
        .recommendations ul { list-style: none; }
        .recommendations li { padding: 10px 0; border-bottom: 1px solid #ffeaa7; }
        .good { color: #4CAF50; }
        .warning { color: #ff9800; }
        .danger { color: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Database Performance Report</h1>
        <p class="timestamp">Generated: ${report.timestamp.toLocaleString()}</p>

        <div class="grid">
            <div class="card">
                <h2>🔌 Connection Stats</h2>
                <div class="stat">
                    <span class="stat-label">Total Connections:</span>
                    <span class="stat-value">${report.connectionStats.total}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Active:</span>
                    <span class="stat-value ${report.connectionStats.active > 50 ? "warning" : "good"}">${report.connectionStats.active}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Idle:</span>
                    <span class="stat-value">${report.connectionStats.idle}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Waiting:</span>
                    <span class="stat-value ${report.connectionStats.waiting > 10 ? "danger" : "good"}">${report.connectionStats.waiting}</span>
                </div>
            </div>

            <div class="card">
                <h2>💾 Database Size</h2>
                <div class="stat">
                    <span class="stat-label">Total Size:</span>
                    <span class="stat-value">${report.databaseSize.totalSize}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Tables:</span>
                    <span class="stat-value">${report.databaseSize.tableCount}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Indexes:</span>
                    <span class="stat-value">${report.databaseSize.indexCount}</span>
                </div>
            </div>

            <div class="card">
                <h2>🎯 Cache Hit Rate</h2>
                <div class="stat">
                    <span class="stat-label">Hit Rate:</span>
                    <span class="stat-value ${report.cacheHitRate.rate > 90 ? "good" : report.cacheHitRate.rate > 70 ? "warning" : "danger"}">${report.cacheHitRate.rate.toFixed(2)}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Blocks Read:</span>
                    <span class="stat-value">${report.cacheHitRate.heapBlocksRead.toLocaleString()}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Blocks Hit:</span>
                    <span class="stat-value">${report.cacheHitRate.heapBlocksHit.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <h2>📊 Table Statistics</h2>
        <table>
            <thead>
                <tr>
                    <th>Table Name</th>
                    <th>Row Count</th>
                    <th>Total Size</th>
                    <th>Index Size</th>
                </tr>
            </thead>
            <tbody>
                ${report.tableStats
                  .map(
                    (table) => `
                    <tr>
                        <td>${table.tableName}</td>
                        <td>${table.rowCount.toLocaleString()}</td>
                        <td>${table.totalSize}</td>
                        <td>${table.indexSize}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>

        ${
          report.slowQueries.length > 0
            ? `
        <h2>🐌 Slow Queries</h2>
        <table>
            <thead>
                <tr>
                    <th>Query</th>
                    <th>Calls</th>
                    <th>Avg Time (ms)</th>
                    <th>Max Time (ms)</th>
                </tr>
            </thead>
            <tbody>
                ${report.slowQueries
                  .map(
                    (query) => `
                    <tr>
                        <td><code>${query.query}</code></td>
                        <td>${query.calls.toLocaleString()}</td>
                        <td class="${query.avgTime > 1000 ? "danger" : query.avgTime > 500 ? "warning" : "good"}">${query.avgTime.toFixed(2)}</td>
                        <td class="${query.maxTime > 2000 ? "danger" : "warning"}">${query.maxTime.toFixed(2)}</td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
        `
            : ""
        }

        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            <ul>
                ${report.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
            </ul>
        </div>
    </div>
</body>
</html>
  `;
}
