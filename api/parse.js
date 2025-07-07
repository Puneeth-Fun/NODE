export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { data, dataType } = req.body;
    if (!data || !data.trim()) {
      return res.status(400).json({ error: 'No data provided' });
    }
    const sanitizeInput = (input) => {
      return typeof input === 'string' ? input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : '';
    };
    const sanitizedData = sanitizeInput(data ? data.trim() : '');
    // Auto-detect: if valid JSON, always parse as JSON
    let effectiveType = dataType;
    if (dataType === 'auto' || !dataType) {
      try {
        JSON.parse(sanitizedData);
        effectiveType = 'json';
      } catch (e) {
        // Not JSON, keep auto
      }
    }
    if (effectiveType === 'json') {
      try {
        const jsonData = JSON.parse(sanitizedData);
        let arrayData = Array.isArray(jsonData) ? jsonData : [jsonData];
        // Recursively explode all arrays of objects into multiple rows, at all levels
        // Deep cartesian explode: for every array of objects at any depth, produce all row combinations
        function recursiveExplode(obj) {
          // Find all array-of-object keys at this level
          let arrays = Object.keys(obj).filter(
            key => Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object'
          );
          if (arrays.length === 0) return [obj];
          // Only explode the first array-of-objects found at this level, then recurse
          const arrayKey = arrays[0];
          const arr = obj[arrayKey];
          const parent = { ...obj };
          delete parent[arrayKey];
          let rows = [];
          arr.forEach(item => {
            // Merge parent and item, prefixing child keys with arrayKey
            const merged = { ...parent };
            for (const k in item) {
              merged[`${arrayKey}_${k}`] = item[k];
            }
            rows.push(...recursiveExplode(merged));
          });
          return rows;
        }
        // Flatten each row
        let exploded = [];
        arrayData.forEach(row => {
          const rows = recursiveExplode(row);
          exploded.push(...rows);
        });
        const flatten = (obj, prefix = '', res = {}) => {
          for (const key in obj) {
            const value = obj[key];
            if (Array.isArray(value)) {
              // Only arrays of primitives should reach here; join as comma-separated
              if (value.length > 0 && typeof value[0] !== 'object') {
                res[prefix + key] = value.join(', ');
              } else {
                // Defensive: if array of objects still here, skip (should not happen)
                res[prefix + key] = '';
              }
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // Only flatten plain objects
              flatten(value, prefix + key + '.', res);
            } else if (
              value !== undefined &&
              value !== null &&
              !(typeof value === 'string' && value === '')
            ) {
              res[prefix + key] = value;
            } else {
              res[prefix + key] = '';
            }
          }
          return res;
        };
        let finalRows = exploded.map(row => flatten(row));
        console.log('DEBUG exploded rows:', JSON.stringify(finalRows, null, 2));
        return res.json({ data: finalRows.slice(0, 1000), type: 'JSON' });
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format.' });
      }
    }
    // Delimited formats
    const lines = sanitizedData.split('\n').filter(line => line.trim());
    let delimiter = ',';
    let typeLabel = 'CSV';
    if (dataType === 'csv') {
      delimiter = ',';
      typeLabel = 'CSV';
    } else if (dataType === 'tsv') {
      delimiter = '\t';
      typeLabel = 'TSV';
    } else if (dataType === 'pipe') {
      delimiter = '|';
      typeLabel = 'Pipe-separated';
    } else if (dataType === 'semicolon') {
      delimiter = ';';
      typeLabel = 'Semicolon-separated';
    }
    if (lines.length > 1) {
      const headers = lines[0].split(delimiter)
        .map(h => h.trim().replace(/^['"]|['"]$/g, ''))
        .filter(h => h);
      if (headers.length > 1) {
        const rows = lines.slice(1, 1001).map(line => {
          const values = line.split(delimiter).map(v => v.trim().replace(/^['"]|['"]$/g, ''));
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
        if (rows.length > 0) {
          return res.json({ data: rows, type: typeLabel });
        }
      }
    }
    return res.status(400).json({ error: `Unrecognized or invalid ${typeLabel} format.` });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
