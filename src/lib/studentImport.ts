import * as XLSX from 'xlsx';

// 실제 운영 중인 "회원명부" 스프레드시트 컬럼 기준 매핑
// (NO, 성명, 원생HP, 부모HP(모), 학교, 반명, 등록시작일, 등록구분, 방문경로,
//  원생-특성그룹2, 입학일자, 생일, 성별, 주소, 학번, 퇴원일자, 최초수강일)
const HEADER_ALIASES: Record<string, string[]> = {
  studentName: ['성명', '이름', '원생명', '학생명'],
  studentPhone: ['원생hp', '원생전화', '학생전화', '학생hp'],
  parentPhone: ['부모hp(모)', '부모hp', '학부모hp', '보호자hp', '부모전화', '학부모전화'],
  school: ['학교'],
  className: ['반명', '강습반'],
  registrationDate: ['등록시작일', '등록일'],
  registrationType: ['등록구분'],
  visitPath: ['방문경로'],
  featureGroup: ['원생-특성그룹2', '특성그룹'],
  admissionDate: ['입학일자'],
  birthDate: ['생일', '생년월일'],
  gender: ['성별'],
  address: ['주소'],
  studentNo: ['학번'],
  withdrawDate: ['퇴원일자'],
  firstClassDate: ['최초수강일'],
};

export type ImportedStudentDraft = {
  studentName: string;
  phone: string;
  birthDate: string;
  age: number;
  gender: '남' | '여';
  address: string;
  registrationDate: string;
  status: 'active' | 'inactive';
  notes: string;
  raw: Record<string, string>;
};

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/\s+/g, '');

function buildHeaderIndex(headers: string[]) {
  const norm = headers.map(normalizeHeader);
  const index: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const aliasNorm = aliases.map(normalizeHeader);
    const idx = norm.findIndex(h => aliasNorm.includes(h));
    if (idx >= 0) index[field] = idx;
  }
  return index;
}

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return 0;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (365.25 * 24 * 3600 * 1000)));
}

function normalizeDate(v: string): string {
  if (!v) return '';
  const cleaned = v.trim().replace(/[./]/g, '-');
  const m = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return '';
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function normalizeGender(v: string): '남' | '여' {
  const t = v.trim();
  if (t.startsWith('여') || /^f/i.test(t)) return '여';
  return '남';
}

export async function parseImportFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const isCsv = /\.csv$/i.test(file.name);
  if (isCsv) {
    const text = (await file.text()).replace(/^﻿/, '');
    const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
    const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
    const [headers, ...body] = rows;
    return { headers: headers ?? [], rows: body };
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' });
  const [headers, ...body] = json;
  return {
    headers: (headers ?? []).map(h => String(h ?? '')),
    rows: body.map(r => r.map(c => String(c ?? ''))),
  };
}

export function mapRowsToDrafts(headers: string[], rows: string[][]): ImportedStudentDraft[] {
  const idx = buildHeaderIndex(headers);
  const get = (row: string[], field: string) => (idx[field] !== undefined ? (row[idx[field]] ?? '').trim() : '');

  return rows
    .filter(row => row.some(cell => cell && cell.trim()))
    .map(row => {
      const studentName = get(row, 'studentName');
      const studentPhone = get(row, 'studentPhone');
      const parentPhone = get(row, 'parentPhone');
      const birthDate = normalizeDate(get(row, 'birthDate'));
      const registrationDate =
        normalizeDate(get(row, 'registrationDate')) ||
        normalizeDate(get(row, 'admissionDate')) ||
        normalizeDate(get(row, 'firstClassDate'));
      const withdrawDate = get(row, 'withdrawDate');
      const registrationType = get(row, 'registrationType');

      const notes = [
        get(row, 'className') && `원본 반명: ${get(row, 'className')}`,
        get(row, 'school') && `학교: ${get(row, 'school')}`,
        get(row, 'visitPath') && `방문경로: ${get(row, 'visitPath')}`,
        get(row, 'featureGroup') && `특성그룹: ${get(row, 'featureGroup')}`,
        get(row, 'studentNo') && `학번: ${get(row, 'studentNo')}`,
      ].filter(Boolean).join(' / ');

      const raw: Record<string, string> = {};
      headers.forEach((h, i) => { raw[h] = row[i] ?? ''; });

      return {
        studentName,
        phone: parentPhone || studentPhone,
        birthDate,
        age: calcAge(birthDate),
        gender: normalizeGender(get(row, 'gender')),
        address: get(row, 'address'),
        registrationDate: registrationDate || new Date().toISOString().slice(0, 10),
        status: (withdrawDate || registrationType.includes('퇴원')) ? 'inactive' as const : 'active' as const,
        notes,
        raw,
      };
    })
    .filter(d => d.studentName);
}
