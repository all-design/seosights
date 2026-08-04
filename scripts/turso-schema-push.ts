/**
 * Turso Schema Push — Pushes Prisma schema to Turso (libsql) production database
 *
 * Since Prisma CLI `db push` doesn't work with Turso (requires file: protocol),
 * this script parses the Prisma schema, generates SQLite DDL statements,
 * and executes them directly via @libsql/client.
 *
 * Usage: bun run scripts/turso-schema-push.ts
 */

import { createClient, type Client } from '@libsql/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Types ────────────────────────────────────────────────────────────────

interface SchemaField {
  name: string;
  type: string;
  isOptional: boolean;
  isId: boolean;
  isUnique: boolean;
  isUpdatedAt: boolean;
  defaultValue: string | null;
}

interface SchemaModel {
  name: string;
  fields: SchemaField[];
  uniqueConstraints: string[][];
  indexes: { fields: string[] }[];
}

// ─── Prisma → SQLite Type Mapping ─────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  String: 'TEXT', Int: 'INTEGER', Float: 'REAL', Boolean: 'INTEGER',
  DateTime: 'TEXT', Json: 'TEXT', BigInt: 'INTEGER', Decimal: 'REAL', Bytes: 'BLOB',
};

function prismaToSqliteType(t: string): string {
  return TYPE_MAP[t] || 'TEXT';
}

// ─── Default Value Mapping ────────────────────────────────────────────────

function mapDefaultValue(dv: string | null): string | null {
  if (!dv) return null;
  if (['cuid()', 'uuid()', 'now()', 'autoincrement()'].includes(dv)) return null;
  if (dv === 'true') return '1';
  if (dv === 'false') return '0';
  if (dv.startsWith('"') && dv.endsWith('"')) return `'${dv.slice(1, -1).replace(/'/g, "''")}'`;
  if (!isNaN(Number(dv))) return dv;
  return null;
}

// ─── Schema Parser ────────────────────────────────────────────────────────

function parsePrismaSchema(schemaText: string): SchemaModel[] {
  const models: SchemaModel[] = [];
  const SCALAR_TYPES = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'BigInt', 'Decimal', 'Bytes']);
  const lines = schemaText.split('\n');
  let currentModel: SchemaModel | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\/\/.*$/, '').trim();
    if (!line) continue;

    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = { name: modelMatch[1], fields: [], uniqueConstraints: [], indexes: [] };
      continue;
    }

    if (line === '}' && currentModel) {
      models.push(currentModel);
      currentModel = null;
      continue;
    }

    if (!currentModel) continue;

    // @@unique([...])
    const uniqueMatch = line.match(/@@unique\(\[([^\]]+)\]\)/);
    if (uniqueMatch) {
      currentModel.uniqueConstraints.push(uniqueMatch[1].split(',').map(f => f.trim()));
      continue;
    }

    // @@index([...])
    const indexMatch = line.match(/@@index\(\[([^\]]+)\]\)/);
    if (indexMatch) {
      currentModel.indexes.push({ fields: indexMatch[1].split(',').map(f => f.trim()) });
      continue;
    }

    // Field line
    const fieldMatch = line.match(/^(\w+)\s+(\w+)(\?)?\s*(.*)?$/);
    if (!fieldMatch) continue;

    const [, fieldName, fieldType, optMark, attrsRaw] = fieldMatch;
    const attrs = attrsRaw || '';

    // Skip non-scalar types (relation fields like "user User @relation(...)")
    if (!SCALAR_TYPES.has(fieldType)) continue;

    const isId = attrs.includes('@id');
    const isUnique = attrs.includes('@unique');
    const isUpdatedAt = attrs.includes('@updatedAt');

    let defaultValue: string | null = null;
    const defaultMatch = attrs.match(/@default\(([^)]+(?:\([^)]*\))?)\)/);
    if (defaultMatch) defaultValue = defaultMatch[1].trim();

    currentModel.fields.push({
      name: fieldName,
      type: fieldType,
      isOptional: optMark === '?',
      isId,
      isUnique,
      isUpdatedAt,
      defaultValue,
    });
  }

  return models;
}

// ─── DDL Generation ───────────────────────────────────────────────────────

function generateCreateTableDDL(model: SchemaModel): string {
  const columnDefs: string[] = [];
  const pkFields: string[] = [];

  for (const field of model.fields) {
    if (field.isId) pkFields.push(field.name);

    const parts: string[] = [field.name, prismaToSqliteType(field.type)];

    if (field.isId && pkFields.length === 1) parts.push('PRIMARY KEY');
    if (!field.isOptional && !field.isId) parts.push('NOT NULL');
    if (field.isUnique && !field.isId) parts.push('UNIQUE');

    const dv = mapDefaultValue(field.defaultValue);
    if (dv !== null) parts.push(`DEFAULT ${dv}`);

    columnDefs.push(parts.join(' '));
  }

  if (pkFields.length > 1) columnDefs.push(`PRIMARY KEY (${pkFields.join(', ')})`);
  for (const c of model.uniqueConstraints) columnDefs.push(`UNIQUE (${c.join(', ')})`);

  return `CREATE TABLE IF NOT EXISTS "${model.name}" (\n  ${columnDefs.join(',\n  ')}\n);`;
}

function generateCreateIndexDDLs(model: SchemaModel): string[] {
  const stmts: string[] = [];
  for (const idx of model.indexes) {
    stmts.push(`CREATE INDEX IF NOT EXISTS "idx_${model.name}_${idx.fields.join('_')}" ON "${model.name}" (${idx.fields.join(', ')});`);
  }
  for (const field of model.fields) {
    if (field.isUnique && !field.isId) {
      stmts.push(`CREATE INDEX IF NOT EXISTS "idx_${model.name}_${field.name}_unique" ON "${model.name}" ("${field.name}");`);
    }
  }
  return stmts;
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Turso Schema Push ===\n');

  // 1. Read .env.production
  const envPath = resolve(__dirname, '../.env.production');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars: Record<string, string> = {};

  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^(\w+)="(.*)"$/) || t.match(/^(\w+)=(.+)$/);
    if (m) envVars[m[1]] = m[2];
  }

  const databaseUrl = envVars['DATABASE_DIRECT_URL'] || envVars['DATABASE_URL'];
  const authToken = envVars['TURSO_AUTH_TOKEN'];

  if (!databaseUrl || !authToken) {
    console.error('ERROR: Missing DATABASE_DIRECT_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  console.log(`DB URL: ${databaseUrl}`);

  // 2. Parse schema
  const schemaText = readFileSync(resolve(__dirname, '../prisma/schema.prisma'), 'utf-8');
  const models = parsePrismaSchema(schemaText);
  console.log(`Models in schema: ${models.length}\n`);

  // 3. Connect
  const client = createClient({ url: databaseUrl, authToken });
  const test = await client.execute('SELECT 1');
  console.log(`Connected: ${test.rows[0][0]}\n`);

  // 4. Get existing tables and their columns
  const tableRows = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  const existingTables = new Set(tableRows.rows.map(r => r.name as string));
  console.log(`Existing tables: ${existingTables.size}`);

  // Get all columns for all existing tables in one go
  const existingColumns = new Map<string, Set<string>>();
  for (const tableName of existingTables) {
    if (tableName.startsWith('_')) continue; // skip internal tables
    try {
      const cols = await client.execute(`PRAGMA table_info("${tableName}")`);
      existingColumns.set(tableName, new Set(cols.rows.map(r => r.name as string)));
    } catch {
      existingColumns.set(tableName, new Set());
    }
  }

  // 5. Push schema
  const tablesCreated: string[] = [];
  const tablesExisting: string[] = [];
  const columnsAdded: string[] = [];
  const indexesCreated: string[] = [];
  const errors: string[] = [];

  // Phase 1: Create new tables
  for (const model of models) {
    if (!existingTables.has(model.name)) {
      const ddl = generateCreateTableDDL(model);
      console.log(`[CREATE] ${model.name}`);
      try {
        await client.execute(ddl);
        tablesCreated.push(model.name);
      } catch (err: any) {
        const msg = err?.message || String(err);
        // If table already exists despite our check, that's fine
        if (msg.includes('already exists')) {
          tablesExisting.push(model.name);
          console.log(`  (already exists, skipping)`);
        } else {
          errors.push(`CREATE ${model.name}: ${msg}`);
          console.error(`  ERROR: ${msg}`);
        }
        continue;
      }

      // Create indexes for new table
      for (const idxDdl of generateCreateIndexDDLs(model)) {
        try {
          await client.execute(idxDdl);
          indexesCreated.push(idxDdl.match(/"([^"]+)"/)?.[1] || '');
        } catch (err: any) {
          const msg = err?.message || String(err);
          if (!msg.includes('already exists')) {
            errors.push(`INDEX: ${msg}`);
          }
        }
      }
    } else {
      tablesExisting.push(model.name);
    }
  }

  // Phase 2: Add missing columns to existing tables
  for (const model of models) {
    if (!existingTables.has(model.name)) continue;
    const existingCols = existingColumns.get(model.name);
    if (!existingCols) continue;

    for (const field of model.fields) {
      if (existingCols.has(field.name)) continue;

      const sqliteType = prismaToSqliteType(field.type);
      const parts: string[] = [sqliteType];

      const dv = mapDefaultValue(field.defaultValue);
      if (dv !== null) {
        parts.push(`DEFAULT ${dv}`);
      } else if (!field.isOptional) {
        // Provide safe defaults for NOT NULL columns being added
        const safeDefaults: Record<string, string> = {
          String: "DEFAULT ''", Int: 'DEFAULT 0', Float: 'DEFAULT 0',
          Boolean: 'DEFAULT 0', DateTime: "DEFAULT ''", Json: "DEFAULT ''",
          BigInt: 'DEFAULT 0', Decimal: 'DEFAULT 0', Bytes: "DEFAULT ''",
        };
        parts.push(safeDefaults[field.type] || "DEFAULT ''");
      }

      const alterDdl = `ALTER TABLE "${model.name}" ADD COLUMN "${field.name}" ${parts.join(' ')};`;
      console.log(`[ALTER] ${model.name}.${field.name} ${parts.join(' ')}`);

      try {
        await client.execute(alterDdl);
        columnsAdded.push(`${model.name}.${field.name}`);
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes('duplicate column name')) {
          // Column exists, that's fine
        } else {
          errors.push(`ALTER ${model.name}.${field.name}: ${msg}`);
          console.error(`  ERROR: ${msg}`);
        }
      }
    }
  }

  // Phase 3: Create indexes for all models (idempotent)
  console.log('\n[Creating indexes...]');
  for (const model of models) {
    for (const idxDdl of generateCreateIndexDDLs(model)) {
      try {
        await client.execute(idxDdl);
        const idxName = idxDdl.match(/"([^"]+)"/)?.[1] || '';
        if (!indexesCreated.includes(idxName)) indexesCreated.push(idxName);
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (!msg.includes('already exists')) {
          errors.push(`INDEX: ${msg}`);
        }
      }
    }
  }

  client.close();

  // 6. Report
  console.log('\n');
  console.log('══════════════════════════════════════════════════════');
  console.log('  SCHEMA PUSH SUMMARY');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  Models in schema:    ${models.length}`);
  console.log(`  Tables created:      ${tablesCreated.length}`);
  console.log(`  Tables existing:     ${tablesExisting.length}`);
  console.log(`  Columns added:       ${columnsAdded.length}`);
  console.log(`  Indexes created:     ${indexesCreated.length}`);
  console.log(`  Errors:              ${errors.length}`);

  if (tablesCreated.length > 0) {
    console.log('\n  NEW TABLES:');
    for (const t of tablesCreated) console.log(`    + ${t}`);
  }

  if (columnsAdded.length > 0) {
    console.log('\n  NEW COLUMNS:');
    for (const c of columnsAdded) console.log(`    + ${c}`);
  }

  if (errors.length > 0) {
    console.log('\n  ERRORS:');
    for (const e of errors) console.log(`    ! ${e}`);
  }

  console.log('\n══════════════════════════════════════════════════════\n');

  if (errors.length > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
