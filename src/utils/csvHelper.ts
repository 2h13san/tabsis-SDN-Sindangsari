import { Siswa, Kelas } from '../types';

export interface ParsedSiswaRow {
  nis: string;
  nisn: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  kelas: string;
  wali_kelas: string;
  orang_tua: string;
  telepon: string;
  saldo: number;
  status: 'Aktif' | 'Lulus' | 'Pindah';
  isValid: boolean;
  errors: string[];
}

// Download Excel (.xls) template for importing student data - guaranteed separate columns in MS Excel
export const downloadSiswaTemplateXls = () => {
  const headers = [
    'NIS',
    'NISN',
    'Nama Lengkap',
    'Jenis Kelamin (L/P)',
    'Kelas',
    'Wali Kelas',
    'Orang Tua / Wali',
    'No Telepon / WA',
    'Saldo Awal (Rp)',
    'Status (Aktif/Lulus/Pindah)',
  ];

  const exampleRows = [
    [
      '2301',
      '0151234101',
      'Aditya Pratama',
      'L',
      '1-A',
      'Dra. Endang Rahayu',
      'Bambang Pratama',
      '081234567801',
      '50000',
      'Aktif',
    ],
    [
      '2302',
      '0151234102',
      'Anisa Putri Maharani',
      'P',
      '1-A',
      'Dra. Endang Rahayu',
      'Rudi Maharani',
      '081234567802',
      '100000',
      'Aktif',
    ],
    [
      '2303',
      '0151234103',
      'Bagus Dwi Cahyono',
      'L',
      '1-B',
      'Ahmad Subagyo, S.Pd.',
      'Cahyono Santoso',
      '081234567803',
      '25000',
      'Aktif',
    ],
  ];

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Template Data Siswa</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #64748b; padding: 8px; text-align: left; }
    td { border: 1px solid #cbd5e1; padding: 6px; mso-number-format:"\\@"; }
    .num { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${exampleRows
        .map(
          (row) => `
      <tr>
        ${row
          .map((val, idx) =>
            idx === 8 ? `<td class="num">${val}</td>` : `<td>${val}</td>`
          )
          .join('')}
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Template_Import_Siswa.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Download CSV template using semicolon (;) delimiter and sep=; directive for Excel
export const downloadSiswaTemplateCsv = () => {
  const headers = [
    'NIS',
    'NISN',
    'Nama Lengkap',
    'Jenis Kelamin (L/P)',
    'Kelas',
    'Wali Kelas',
    'Orang Tua / Wali',
    'No Telepon / WA',
    'Saldo Awal (Rp)',
    'Status (Aktif/Lulus/Pindah)',
  ];

  const exampleRows = [
    [
      '2301',
      '0151234101',
      'Aditya Pratama',
      'L',
      '1-A',
      'Dra. Endang Rahayu',
      'Bambang Pratama',
      '081234567801',
      '50000',
      'Aktif',
    ],
    [
      '2302',
      '0151234102',
      'Anisa Putri Maharani',
      'P',
      '1-A',
      'Dra. Endang Rahayu',
      'Rudi Maharani',
      '081234567802',
      '100000',
      'Aktif',
    ],
    [
      '2303',
      '0151234103',
      'Bagus Dwi Cahyono',
      'L',
      '1-B',
      'Ahmad Subagyo, S.Pd.',
      'Cahyono Santoso',
      '081234567803',
      '25000',
      'Aktif',
    ],
  ];

  const csvLines = [
    'sep=;',
    headers.map((h) => `"${h}"`).join(';'),
    ...exampleRows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(';')),
  ];

  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Template_Import_Siswa.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Default template trigger
export const downloadSiswaTemplate = downloadSiswaTemplateXls;

// Export active student list to Excel (.xls)
export const exportSiswaToExcel = (siswaList: Siswa[], filenamePrefix = 'Data_Siswa_Tabungan') => {
  const headers = [
    'NIS',
    'NISN',
    'Nama Lengkap',
    'Jenis Kelamin',
    'Kelas',
    'Wali Kelas',
    'Orang Tua / Wali',
    'No Telepon / WA',
    'Saldo Tabungan (Rp)',
    'Status',
    'Tanggal Daftar',
  ];

  const dateStr = new Date().toISOString().split('T')[0];

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Data Siswa Tabungan</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #475569; padding: 8px; text-align: left; }
    td { border: 1px solid #cbd5e1; padding: 6px; mso-number-format:"\\@"; }
    .num { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; font-weight: bold; }
  </style>
</head>
<body>
  <h2>Data Tabungan Siswa (${dateStr})</h2>
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${siswaList
        .map(
          (s) => `
      <tr>
        <td>${s.nis}</td>
        <td>${s.nisn || ''}</td>
        <td>${s.nama}</td>
        <td>${s.jenis_kelamin}</td>
        <td>${s.kelas}</td>
        <td>${s.wali_kelas || ''}</td>
        <td>${s.orang_tua || ''}</td>
        <td>${s.telepon || ''}</td>
        <td class="num">${s.saldo || 0}</td>
        <td>${s.status || 'Aktif'}</td>
        <td>${s.tanggal_daftar || ''}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export active student list to CSV (Semicolon separated for Excel)
export const exportSiswaToCsv = (siswaList: Siswa[], filenamePrefix = 'Data_Siswa_Tabungan') => {
  const headers = [
    'NIS',
    'NISN',
    'Nama Lengkap',
    'Jenis Kelamin',
    'Kelas',
    'Wali Kelas',
    'Orang Tua / Wali',
    'No Telepon / WA',
    'Saldo Tabungan (Rp)',
    'Status',
    'Tanggal Daftar',
  ];

  const rows = siswaList.map((s) => [
    s.nis,
    s.nisn || '',
    s.nama,
    s.jenis_kelamin,
    s.kelas,
    s.wali_kelas || '',
    s.orang_tua || '',
    s.telepon || '',
    s.saldo ? s.saldo.toString() : '0',
    s.status || 'Aktif',
    s.tanggal_daftar || '',
  ]);

  const csvLines = [
    'sep=;',
    headers.map((h) => `"${h}"`).join(';'),
    ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(';')),
  ];

  const dateStr = new Date().toISOString().split('T')[0];
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Auto-detect CSV delimiter (comma, semicolon, tab)
const detectDelimiter = (text: string): string => {
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0 && !l.trim().toLowerCase().startsWith('sep='));
  if (lines.length === 0) return ';';
  const firstLine = lines[0];
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (semicolons >= commas && semicolons >= tabs) return ';';
  if (tabs > commas && tabs > semicolons) return '\t';
  return ',';
};

// Parse raw CSV line into cell tokens handling quoted fields
const parseCsvLine = (line: string, delimiter: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
};

// Helper to extract rows from HTML/XLS content if user uploaded an HTML-table file (.xls)
const parseHtmlTableContent = (htmlText: string): string[][] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));

  return rows
    .map((tr) => {
      const cells = Array.from(tr.querySelectorAll('th, td'));
      return cells.map((cell) => cell.textContent?.trim() || '');
    })
    .filter((row) => row.some((cell) => cell.length > 0));
};

// Parse uploaded CSV / HTML content into array of validated Siswa rows
export const parseSiswaCsvContent = (
  rawContent: string,
  existingSiswaList: Siswa[],
  kelasList: Kelas[]
): ParsedSiswaRow[] => {
  const cleanContent = rawContent.replace(/^\uFEFF/, '').trim();
  if (!cleanContent) return [];

  let matrixRows: string[][] = [];

  // If HTML / XLS table upload
  if (cleanContent.includes('<tr') || cleanContent.includes('<td') || cleanContent.includes('<th')) {
    matrixRows = parseHtmlTableContent(cleanContent);
  } else {
    // Normal CSV / TSV text
    const lines = cleanContent
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.toLowerCase().startsWith('sep='));

    if (lines.length === 0) return [];

    const delimiter = detectDelimiter(cleanContent);
    matrixRows = lines.map((line) => parseCsvLine(line, delimiter));
  }

  if (matrixRows.length === 0) return [];

  // Header parsing
  const headerCells = matrixRows[0].map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  // Helper to find column index by keyword aliases
  const findColIndex = (aliases: string[]): number => {
    return headerCells.findIndex((cell) => aliases.some((a) => cell.includes(a)));
  };

  const nisIdx = findColIndex(['nis', 'induk', 'id']);
  const nisnIdx = findColIndex(['nisn', 'nasional']);
  const namaIdx = findColIndex(['nama', 'murid', 'siswa']);
  const jkIdx = findColIndex(['jenis', 'kelamin', 'jk', 'gender']);
  const kelasIdx = findColIndex(['kelas', 'kls']);
  const waliIdx = findColIndex(['wali', 'guru']);
  const ortuIdx = findColIndex(['orang', 'tua', 'ortu', 'ibu', 'ayah']);
  const telpIdx = findColIndex(['telepon', 'hp', 'wa', 'kontak', 'phone']);
  const saldoIdx = findColIndex(['saldo', 'tabungan', 'uang', 'nom']);
  const statusIdx = findColIndex(['status', 'keadaan']);

  const parsedRows: ParsedSiswaRow[] = [];
  const seenNisSet = new Set<string>();

  // Process data rows
  for (let i = 1; i < matrixRows.length; i++) {
    const cells = matrixRows[i];
    if (!cells || cells.length === 0) continue;

    const getVal = (idx: number, fallback = ''): string => {
      if (idx !== -1 && cells[idx] !== undefined) {
        return cells[idx].replace(/^"|"$/g, '').trim();
      }
      return fallback;
    };

    const nis = getVal(nisIdx, getVal(0, `230${i}`));
    const nisn = getVal(nisnIdx, `00${nis}`);
    const nama = getVal(namaIdx, getVal(1, `Siswa Baru ${i}`));
    const rawJk = getVal(jkIdx, 'L').toUpperCase();
    const jenis_kelamin: 'L' | 'P' = rawJk.startsWith('P') || rawJk === 'PEREMPUAN' ? 'P' : 'L';
    const kelas = getVal(kelasIdx, kelasList[0]?.nama_kelas || '1-A');

    // Auto-fill wali kelas from kelasList if not provided in file
    const matchedK = kelasList.find((k) => k.nama_kelas === kelas);
    const wali_kelas = getVal(waliIdx, matchedK ? matchedK.wali_kelas : 'Wali Kelas');

    const orang_tua = getVal(ortuIdx, 'Orang Tua Siswa');
    const telepon = getVal(telpIdx, '081234567890');

    // Parse Saldo
    const rawSaldoStr = getVal(saldoIdx, '0').replace(/[^0-9]/g, '');
    const saldo = parseInt(rawSaldoStr, 10) || 0;

    // Status
    const rawStatus = getVal(statusIdx, 'Aktif').toLowerCase();
    let status: 'Aktif' | 'Lulus' | 'Pindah' = 'Aktif';
    if (rawStatus.includes('lulus')) status = 'Lulus';
    else if (rawStatus.includes('pindah')) status = 'Pindah';

    // Validation checks
    const errors: string[] = [];

    if (!nis) {
      errors.push('NIS tidak boleh kosong');
    } else if (seenNisSet.has(nis)) {
      errors.push(`NIS ${nis} ganda di dalam file ini`);
    }

    if (!nama) {
      errors.push('Nama siswa wajib diisi');
    }

    if (nis) {
      seenNisSet.add(nis);
    }

    parsedRows.push({
      nis,
      nisn,
      nama,
      jenis_kelamin,
      kelas,
      wali_kelas,
      orang_tua,
      telepon,
      saldo,
      status,
      isValid: errors.length === 0,
      errors,
    });
  }

  return parsedRows;
};
