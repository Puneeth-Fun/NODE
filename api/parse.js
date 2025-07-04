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
    if (dataType === 'json') {
      try {
        const jsonData = JSON.parse(sanitizedData);
        let arrayData = Array.isArray(jsonData) ? jsonData : [jsonData];
        const flatten = (obj, prefix = '', res = {}) => {
          for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              flatten(value, prefix + key + '.', res);
            } else if (Array.isArray(value)) {
              res[prefix + key] = JSON.stringify(value);
            } else if (typeof value === 'boolean') {
              res[prefix + key] = value;
            } else if (value === 0) {
              res[prefix + key] = value;
            } else if (value !== undefined && value !== null && value !== '') {
              res[prefix + key] = value;
            } else {
              res[prefix + key] = '';
            }
          }
          return res;
        };
        arrayData = arrayData.map(row => flatten(row));
        return res.json({ data: arrayData.slice(0, 1000), type: 'JSON' });
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
