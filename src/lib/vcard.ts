// 브라우저에는 OS 연락처에 직접 쓰는 API가 없어, vCard(.vcf) 파일을 다운로드시켜
// 모바일에서 탭하면 OS의 "새 연락처 만들기" 화면이 열리도록 하는 방식으로 "연락처 추가"를 구현한다.
export function downloadVCard({ name, phone }: { name: string; phone: string }) {
  if (!phone) return;
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `TEL;TYPE=CELL:${phone}`,
    'END:VCARD',
  ].join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
