const express = require('express');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001

// Security & middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"]
    }
  }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.csv', '.tsv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});




// No longer needed: correctDataWithGemini and validateApiKey are now inlined in /api/fix

// Routes
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Data Table Viewer</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%231e3a8a'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='white'%3E🤖%3C/text%3E%3C/svg%3E">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #1e293b 0%, #1e3a8a 50%, #1e293b 100%);
            font-family: 'Inter', system-ui, sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
        }
        .glass {
            backdrop-filter: blur(16px);
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
        }
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animated-bg {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: 0;
            pointer-events: none;
            background: radial-gradient(circle at 20% 30%, #6366f1 0%, transparent 60%),
                        radial-gradient(circle at 80% 70%, #f472b6 0%, transparent 60%);
            opacity: 0.18;
            animation: bgmove 10s linear infinite alternate;
        }
        @keyframes bgmove {
            0% { background-position: 20% 30%, 80% 70%; }
            100% { background-position: 30% 40%, 70% 60%; }
        }
        .zebra tbody tr:nth-child(even) { background-color: rgba(30, 58, 138, 0.08); }
        .zebra tbody tr:hover { background-color: rgba(59, 130, 246, 0.13); transition: background 0.2s; }
        .focus-ring:focus { outline: 2px solid #6366f1; outline-offset: 2px; }
        .transition-all { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .lds-dual-ring {
          display: inline-block;
          width: 80px;
          height: 80px;
          border: 8px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          border-top-color: #6366f1;
          animation: lds-dual-ring 1.2s linear infinite;
        }
        @keyframes lds-dual-ring {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="min-h-screen p-6 relative">
    <div class="animated-bg"></div>
    <div id="loadingOverlay" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(30,41,59,0.45);z-index:9999;align-items:center;justify-content:center;pointer-events:all;" aria-busy="true" role="status">
        <div class="lds-dual-ring"></div>
    </div>
    <div class="max-w-7xl mx-auto space-y-6 relative z-10">
        <div class="text-center">
            <h1 class="text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">🤖 AI Data Table Viewer</h1>
            <p class="text-gray-200 text-lg font-medium">Production-ready data parsing powered by <span class="text-blue-300 font-semibold">Google Gemini AI</span></p>
        </div>

        <div class="glass rounded-2xl p-6 shadow-xl">
            <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2"><span>⚙️</span> API Configuration</h2>
            <div class="flex gap-3">
                <input type="password" id="apiKey" placeholder="Enter your Gemini API key (AIza...)" 
                       class="flex-1 bg-black bg-opacity-20 border border-white border-opacity-20 rounded-xl p-3 text-white placeholder-gray-400 focus-ring transition-all">
                <button onclick="toggleApiKey()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-all focus-ring">👁️</button>
            </div>
            <p class="text-blue-200 text-xs mt-2">Get your free API key: <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-blue-400 underline hover:text-blue-200 transition-all">Google AI Studio</a></p>
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 glass rounded-2xl p-6 shadow-lg">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold text-white flex items-center gap-2">📄 Input Data</h2>
                    <span id="dataType" class="hidden bg-green-500 bg-opacity-20 text-green-300 px-3 py-1 rounded-full text-sm font-semibold transition-all">✅ Detected</span>
                </div>
                <textarea id="inputData" placeholder="Paste your data here or upload a file..." 
                          class="w-full h-64 bg-black bg-opacity-20 border border-white border-opacity-20 rounded-xl p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm focus-ring transition-all"></textarea>
            </div>

            <div class="space-y-6">
                <div class="glass rounded-xl p-4 shadow-md">
                    <input type="file" id="fileInput" accept=".json,.csv,.txt,.tsv" class="hidden">
                    <button onclick="document.getElementById('fileInput').click()" 
                            class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 focus-ring">
                        📁 Upload File
                    </button>
                    <p class="text-xs text-gray-400 text-center mt-2">Supports JSON, CSV, TSV files up to 10MB</p>
                </div>

                <div id="errorSection" class="hidden bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-xl p-4 shadow-md">
                    <div class="flex items-start gap-3">
                        <span class="text-red-400 text-2xl">⚠️</span>
                        <div class="flex-1">
                            <h3 class="text-red-300 font-semibold">Parse Error</h3>
                            <p id="errorMessage" class="text-red-200 text-sm mt-1"></p>
                            <button onclick="fixWithAI()" class="mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-all focus-ring">
                                ✨ Fix with AI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="dataTable" class="hidden glass rounded-2xl border border-white border-opacity-20 overflow-hidden shadow-xl">
            <div class="p-6 border-b border-white border-opacity-20">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-semibold text-white flex items-center gap-2">🗃️ Data Table</h2>
                        <p id="tableInfo" class="text-gray-300 text-sm mt-1"></p>
                    </div>
                    <div class="flex gap-3">
                        <select id="rowsPerPage" class="bg-black bg-opacity-20 border border-white border-opacity-20 rounded-lg px-3 py-2 text-white text-sm focus-ring transition-all">
                            <option value="25">25 rows</option>
                            <option value="50" selected>50 rows</option>
                            <option value="100">100 rows</option>
                        </select>
                        <button onclick="exportCSV()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all focus-ring">📥 Export CSV</button>
                    </div>
                </div>
            </div>
            <div class="overflow-auto max-h-96">
                <table id="table" class="w-full zebra"></table>
            </div>
            <div id="pagination" class="p-4 border-t border-white border-opacity-20 flex items-center justify-between"></div>
        </div>

        <div id="toast" class="hidden fixed top-4 right-4 max-w-md p-4 rounded-xl border backdrop-blur-lg z-50 animate-slide-in shadow-xl">
            <div class="flex items-center gap-3">
                <span id="toastIcon"></span>
                <span id="toastMessage" class="text-sm font-medium"></span>
                <button onclick="hideToast()" class="ml-auto text-lg hover:opacity-70">×</button>
            </div>
        </div>
    </div>

    <script>
        let currentData = [];
        let currentPage = 1;
        let rowsPerPage = 50;

        function showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            const icon = document.getElementById('toastIcon');
            const msg = document.getElementById('toastMessage');
            
            const styles = {
                success: 'bg-green-500 bg-opacity-20 border-green-500 border-opacity-30 text-green-300',
                error: 'bg-red-500 bg-opacity-20 border-red-500 border-opacity-30 text-red-300',
                info: 'bg-blue-500 bg-opacity-20 border-blue-500 border-opacity-30 text-blue-300'
            };
            
            const icons = { success: '✅', error: '❌', info: 'ℹ️' };
            
            toast.className = \`fixed top-4 right-4 max-w-md p-4 rounded-xl border backdrop-blur-lg z-50 animate-slide-in \${styles[type]}\`;
            icon.textContent = icons[type];
            msg.textContent = message;
            toast.classList.remove('hidden');
            
            setTimeout(hideToast, 5000);
        }

        function hideToast() {
            document.getElementById('toast').classList.add('hidden');
        }

        function toggleApiKey() {
            const input = document.getElementById('apiKey');
            input.type = input.type === 'password' ? 'text' : 'password';
        }

        async function parseData(data) {
            showLoading(true);
            try {
                const response = await fetch('/api/parse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data })
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error);
                }
                return result;
            } catch (error) {
                throw error;
            } finally {
                showLoading(false);
            }
        }

        async function fixWithAI() {
            const data = document.getElementById('inputData').value;
            const apiKey = document.getElementById('apiKey').value;
            if (!apiKey) {
                showToast('Please enter your Gemini API key first', 'error');
                return;
            }
            showLoading(true);
            try {
                showToast('AI is fixing your data...', 'info');
                const response = await fetch('/api/fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data, apiKey })
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error);
                }
                document.getElementById('inputData').value = result.correctedData;
                await handleDataChange();
                showToast('AI successfully corrected your data!', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                showLoading(false);
            }
        }

        function showLoading(show) {
            const overlay = document.getElementById('loadingOverlay');
            overlay.style.display = show ? 'flex' : 'none';
        }

        function renderTable() {
            if (!currentData.length) return;
            
            const table = document.getElementById('table');
            const tableInfo = document.getElementById('tableInfo');
            const dataTable = document.getElementById('dataTable');
            
            const columns = [...new Set(currentData.flatMap(Object.keys))];
            const totalRows = currentData.length;
            
            // Update info
            tableInfo.textContent = \`\${totalRows} rows • \${columns.length} columns\`;
            
            // Calculate pagination
            const startIndex = (currentPage - 1) * rowsPerPage;
            const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
            const pageData = currentData.slice(startIndex, endIndex);
            
            // Render table
            table.innerHTML = \`
                <thead class="sticky top-0 bg-black bg-opacity-60 backdrop-blur-sm">
                    <tr>
                        \${columns.map(col => \`<th class="px-6 py-4 text-left text-sm font-semibold text-blue-300 border-b border-white border-opacity-10">\${col}</th>\`).join('')}
                    </tr>
                </thead>
                <tbody>
                    \${pageData.map((row, i) => \`
                        <tr class="hover:bg-white hover:bg-opacity-5 border-b border-white border-opacity-5">
                            \${columns.map(col => \`<td class="px-6 py-4 text-sm text-gray-200"><div class="max-w-xs truncate" title="\${(row[col] || '').toString()}">\${(row[col] || '').toString()}</div></td>\`).join('')}
                        </tr>
                    \`).join('')}
                </tbody>
            \`;
            
            renderPagination();
            dataTable.classList.remove('hidden');
        }

        function renderPagination() {
            const pagination = document.getElementById('pagination');
            const totalPages = Math.ceil(currentData.length / rowsPerPage);
            
            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }
            
            pagination.innerHTML = \`
                <div class="text-sm text-gray-300">Page \${currentPage} of \${totalPages}</div>
                <div class="flex gap-2">
                    <button onclick="changePage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled' : ''} 
                            class="px-3 py-1 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded">
                        Previous
                    </button>
                    <button onclick="changePage(\${currentPage + 1})" \${currentPage === totalPages ? 'disabled' : ''} 
                            class="px-3 py-1 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded">
                        Next
                    </button>
                </div>
            \`;
        }

        function changePage(page) {
            const totalPages = Math.ceil(currentData.length / rowsPerPage);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                renderTable();
            }
        }

        async function exportCSV() {
            if (!currentData.length) return;
            
            try {
                const response = await fetch('/api/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: currentData })
                });
                
                if (!response.ok) throw new Error('Export failed');
                
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`data_export_\${new Date().toISOString().split('T')[0]}.csv\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showToast('CSV exported successfully!', 'success');
            } catch (error) {
                showToast('Export failed. Please try again.', 'error');
            }
        }

        // Event listeners
        document.getElementById('inputData').addEventListener('input', handleDataChange);
        document.getElementById('rowsPerPage').addEventListener('change', (e) => {
            rowsPerPage = parseInt(e.target.value);
            currentPage = 1;
            renderTable();
        });

        document.getElementById('fileInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error);
                }
                
                document.getElementById('inputData').value = result.content;
                await handleDataChange();
                showToast(\`File "\${file.name}" loaded successfully\`, 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    </script>
</body>
</html>
  `);
});

app.post('/api/parse', (req, res) => {
  try {
    const { data, dataType } = req.body;
    if (!data || !data.trim()) {
      return res.status(400).json({ error: 'No data provided' });
    }
    const sanitizeInput = (input) => {
      return typeof input === 'string' ? input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : '';
    };
    const sanitizedData = sanitizeInput(data ? data.trim() : '');
    // If user selected a type, use it. Otherwise, auto-detect.
    if (dataType === 'json' || dataType === 'auto' || !dataType) {
      try {
        const jsonData = JSON.parse(sanitizedData);
        let arrayData = Array.isArray(jsonData) ? jsonData : [jsonData];
        // --- Use improved recursive explode and flatten logic ---
        function recursiveExplode(obj) {
          let arrays = Object.keys(obj).filter(
            key => Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object'
          );
          if (arrays.length === 0) return [obj];
          const arrayKey = arrays[0];
          const arr = obj[arrayKey];
          const parent = { ...obj };
          delete parent[arrayKey];
          let rows = [];
          arr.forEach(item => {
            const merged = { ...parent };
            for (const k in item) {
              merged[`${arrayKey}_${k}`] = item[k];
            }
            rows.push(...recursiveExplode(merged));
          });
          return rows;
        }
        const flatten = (obj, prefix = '', res = {}) => {
          for (const key in obj) {
            const value = obj[key];
            if (Array.isArray(value)) {
              if (value.length > 0 && typeof value[0] !== 'object') {
                res[prefix + key] = value.join(', ');
              } else {
                res[prefix + key] = '';
              }
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
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
        let exploded = [];
        arrayData.forEach(row => {
          const rows = recursiveExplode(row);
          exploded.push(...rows);
        });
        let finalRows = exploded.map(row => flatten(row));
        return res.json({ data: finalRows.slice(0, 1000), type: 'JSON' });
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format.' });
      }
    } else if (dataType === 'csv' || dataType === 'tsv' || dataType === 'pipe' || dataType === 'semicolon') {
      let delimiter = ',';
      let typeLabel = 'CSV';
      if (dataType === 'tsv') { delimiter = '\t'; typeLabel = 'TSV'; }
      else if (dataType === 'pipe') { delimiter = '|'; typeLabel = 'Pipe-separated'; }
      else if (dataType === 'semicolon') { delimiter = ';'; typeLabel = 'Semicolon-separated'; }
      const lines = sanitizedData.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^['"]|['"]$/g, '')).filter(h => h);
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
    } else {
      // Auto-detect (original logic)
      const result = parseData(data);
      if (!result) {
        return res.status(400).json({ error: 'No data provided' });
      }
      res.json(result);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/fix', async (req, res) => {
  try {
    const { data, apiKey } = req.body;
    if (!apiKey || !apiKey.trim().startsWith('AIza')) {
      return res.status(400).json({ error: 'Please enter a valid Gemini API key first' });
    }
    const prompt = `Fix this malformed data to make it valid JSON or CSV format. Return ONLY the corrected data, no explanations:\n\n${data}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, topK: 1, topP: 0.8, maxOutputTokens: 8192 }
        })
      }
    );
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }
    let correctedData = result.candidates[0].content.parts[0].text;
    // Remove all leading/trailing code blocks (``` or ```json, etc.) and trim whitespace
    correctedData = correctedData.replace(/^```[\w]*\s*([\r\n])?/i, '')
                                 .replace(/([\r\n])?```\s*$/i, '')
                                 .trim();
    // If still wrapped in code block (sometimes AI returns double code blocks), remove again
    correctedData = correctedData.replace(/^```[\w]*\s*([\r\n])?/i, '').replace(/([\r\n])?```\s*$/i, '').trim();
    return res.json({ correctedData });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const content = req.file.buffer.toString('utf8');
    res.json({ content, filename: req.file.originalname });
  } catch (error) {
    res.status(400).json({ error: 'File processing failed' });
  }
});

app.post('/api/export', (req, res) => {
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
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Data Table Viewer running on http://localhost:${PORT}`);
  console.log('📋 Features: Data parsing, AI correction, CSV export, file upload');
});

module.exports = app;