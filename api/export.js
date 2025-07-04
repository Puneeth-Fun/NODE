
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { data } = req.body;
    if (!data || !data.length) {
      return res.status(400).json({ error: 'No data to export' });
    }
    const columns = [...new Set(data.flatMap(Object.keys))];
    const csvContent = [
      columns.join(','),
      ...data.map(row =>
        columns.map(col => {
          const value = (row[col] || '').toString().replace(/"/g, '""');
          return `"${value}"`;
        }).join(',')
      )
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="data_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
}
