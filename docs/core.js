/* Independent implementation. No I/O, dependencies, database or network access. */
'use strict';
(function (root) {
  const LIMITS = Object.freeze({ inputBytes: 5 * 1024 * 1024, fieldChars: 65536,
    columns: 128, records: 50000, physicalLines: 100000, diagnostics: 200, profileBytes: 65536 });
  const own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const keys = (o, allowed) => Object.keys(o).every(k => allowed.includes(k));
  function checkProfile(p) {
    if (!object(p) || !keys(p, ['version','format','encoding','delimiter','quote','escape','header','null','columns','forceNull','forceNotNull']) ||
      p.version !== 1 || p.format !== 'csv' || p.encoding !== 'utf-8' || p.delimiter !== ',' ||
      p.quote !== '"' || p.escape !== '"' || typeof p.header !== 'boolean' ||
      (own(p,'null') && (typeof p.null !== 'string' || p.null.length > 128 || /[\r\n\0",]/.test(p.null))) ||
      !Array.isArray(p.columns) || !p.columns.length || p.columns.length > LIMITS.columns)
      return 'Unsupported or invalid profile. Use version 1, UTF-8, comma CSV, double quote/escape, boolean header and supported options only.';
    const names = new Set();
    for (const c of p.columns) {
      if (!object(c) || !keys(c,['name','type','notNull']) || typeof c.name !== 'string' ||
        !c.name.length || c.name.length > 128 || /[\x00-\x1f]/.test(c.name) || names.has(c.name) ||
        !['text','int4','int8'].includes(c.type) || (own(c,'notNull') && typeof c.notNull !== 'boolean'))
        return 'Unsupported or invalid column definition. Only unique names, text/int4/int8 and boolean notNull are supported.';
      names.add(c.name);
    }
    for (const key of ['forceNull','forceNotNull']) {
      if (own(p,key) && (!Array.isArray(p[key]) || p[key].length > p.columns.length ||
        p[key].some(n => !names.has(n)) || new Set(p[key]).size !== p[key].length))
        return 'FORCE options must contain unique, declared column names.';
    }
    return null;
  }
  function validate(text, profile, lowerLimits = {}) {
    const limits = { ...LIMITS };
    for (const [key,value] of Object.entries(lowerLimits)) {
      if (own(limits,key) && Number.isInteger(value) && value > 0) limits[key] = Math.min(value, limits[key]);
    }
    const diagnostics = [];
    let complete = true, records = 0, i = 0, line = 1, column = 1, stop = false, recordEol = null;
    const result = () => ({ status: !complete ? 'incomplete' : diagnostics.length ? 'invalid' : 'valid',
      complete, records, diagnostics });
    function add(code, message, pos = {line:1,column:1}, field = null, fatal = false) {
      if (diagnostics.length >= limits.diagnostics) {
        complete = false; stop = true;
        // Keep the hard diagnostic cap, while making truncation visible.
        diagnostics[limits.diagnostics-1] = { code:'DIAGNOSTIC_LIMIT', message:'Diagnostic limit reached; check stopped.',
          line:pos.line, column:pos.column, field, record:records };
        return;
      }
      diagnostics.push({ code, message, line:pos.line, column:pos.column, field, record:records });
      if (fatal) { complete = false; stop = true; }
    }
    const problem = checkProfile(profile);
    if (problem) { add('PROFILE', problem, undefined, null, true); return result(); }
    if (typeof text !== 'string') { add('INPUT','Input must be decoded UTF-8 text.',undefined,null,true); return result(); }
    if (text.length > limits.inputBytes || new TextEncoder().encode(text).byteLength > limits.inputBytes) {
      add('INPUT_LIMIT','Input byte limit exceeded.',undefined,null,true); return result();
    }
    if (text.startsWith('\ufeff')) { add('BOM','UTF-8 BOM is unsupported; no checks completed.',undefined,null,true); return result(); }
    if (!text.length) { add('EMPTY','Empty CSV is outside this spike scope.',undefined,null,true); return result(); }
    const forceNull = new Set(profile.forceNull || []), forceNotNull = new Set(profile.forceNotNull || []);
    const nullToken = profile.null ?? '';
    function position() { return {line,column}; }
    function advance() {
      const ch = text[i++];
      if (ch === '\r') {
        if (text[i] === '\n') i++;
        line++; column = 1;
      } else if (ch === '\n') { line++; column = 1; }
      else column++;
      if (line > limits.physicalLines) add('LINE_LIMIT','Physical line limit exceeded.',position(),null,true);
    }
    function consumeRow(row) {
      records++;
      if (records > limits.records) { add('ROW_LIMIT','Record limit exceeded.',row[0].pos,null,true); return; }
      if (row.length === 1 && !row[0].quoted && row[0].value === '\\.') {
        add('COPY_TERMINATOR','COPY end marker is unsupported in local CSV files.',row[0].pos,1,true); return;
      }
      // HEADER true skips one record, as COPY does; it does not mean HEADER MATCH.
      if (profile.header && records === 1) return;
      if (row.length !== profile.columns.length) {
        add('COLUMN_COUNT','Field count differs from the saved profile.',row[0].pos); return;
      }
      for (let n = 0; n < row.length && !stop; n++) {
        const cell = row[n], spec = profile.columns[n];
        const isNull = cell.value === nullToken && (cell.quoted ? forceNull.has(spec.name) : !forceNotNull.has(spec.name));
        if (isNull) {
          if (spec.notNull) add('NOT_NULL','Unquoted/forced NULL violates NOT NULL.',cell.pos,n+1);
          continue;
        }
        if (spec.type === 'text') continue;
        const value = cell.value.replace(/^[\t\n\v\f\r ]+|[\t\n\v\f\r ]+$/g,'');
        if (/^[+-]?0[xob]/i.test(value) || value.includes('_')) {
          add('INTEGER_UNSUPPORTED','Only decimal integer notation is supported.',cell.pos,n+1,true); continue;
        }
        if (!/^[+-]?[0-9]+$/.test(value)) {
          add('INTEGER_SYNTAX','Expected a decimal integer; quoted empty text is not NULL.',cell.pos,n+1); continue;
        }
        // Bound the BigInt work as well as the CSV input; leading zeroes do not affect range.
        const digits = value.replace(/^[+-]/,'').replace(/^0+/, '') || '0';
        const maxDigits = spec.type === 'int4' ? 10 : 19;
        if (digits.length > maxDigits) { add('INTEGER_RANGE',`Outside PostgreSQL ${spec.type} range.`,cell.pos,n+1); continue; }
        const integer = BigInt((value[0] === '-' ? '-' : '') + digits);
        const min = spec.type === 'int4' ? -2147483648n : -9223372036854775808n;
        const max = spec.type === 'int4' ? 2147483647n : 9223372036854775807n;
        if (integer < min || integer > max) add('INTEGER_RANGE',`Outside PostgreSQL ${spec.type} range.`,cell.pos,n+1);
      }
    }
    while (i < text.length && !stop) {
      const row = [];
      let another = true;
      while (another && !stop) {
        const pos = position();
        let value = '', quoted = false, closed = false;
        if (text[i] === '"') { quoted = true; advance(); }
        while (i < text.length && !stop) {
          const ch = text[i];
          if (ch === '\0') { add('NUL','NUL byte is not valid PostgreSQL text.',position(),row.length+1,true); break; }
          if (quoted) {
            if (ch === '"') {
              advance();
              if (text[i] === '"') { value += '"'; advance(); }
              else { closed = true; break; }
            } else {
              const before = i; advance(); value += text.slice(before,i);
            }
          } else {
            if (ch === ',' || ch === '\r' || ch === '\n') break;
            if (ch === '"') { add('CSV_UNSUPPORTED','Quote inside an unquoted field is unsupported; stopped.',position(),row.length+1,true); break; }
            value += ch; advance();
          }
          if (value.length > limits.fieldChars) add('FIELD_LIMIT','Field length limit exceeded.',pos,row.length+1,true);
        }
        if (stop) break;
        if (quoted && !closed) { add('CSV_MALFORMED','Unterminated quoted field; later records were not checked.',pos,row.length+1,true); break; }
        if (quoted && i < text.length && ![',','\r','\n'].includes(text[i])) {
          add('CSV_UNSUPPORTED','Content after a closing quote is unsupported; stopped.',position(),row.length+1,true); break;
        }
        row.push({ value, quoted, pos });
        if (row.length > limits.columns) { add('COLUMN_LIMIT','Column limit exceeded.',pos,null,true); break; }
        if (text[i] === ',') { advance(); }
        else {
          another = false;
          if (i < text.length) {
            const eol = text[i] === '\r' && text[i+1] === '\n' ? '\r\n' : text[i];
            if (recordEol !== null && eol !== recordEol) add('CSV_LINE_ENDING','Inconsistent record line endings; check stopped.',position(),null,true);
            recordEol = eol;
            if (!stop) advance();
          }
        }
      }
      if (!stop) consumeRow(row);
    }
    return result();
  }
  const api = { validate, checkProfile, LIMITS };
  if (typeof module !== 'undefined') module.exports = api;
  else root.CopyPreflight = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
