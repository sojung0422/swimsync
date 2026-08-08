import React, { useState } from 'react';
import {
  Target, TrendingUp, Layers, Code2, DollarSign, Megaphone,
  Map, BarChart2, AlertTriangle, Users, ChevronRight, Building2,
  Zap, Globe, Star, CheckCircle, XCircle, ArrowRight, Cpu,
  CreditCard, Bell, Calendar, ClipboardList, LayoutGrid,
  Smartphone, ShieldCheck, Package, IdCard, HelpCircle,
  ListChecks, MessageSquareText, CalendarClock, RefreshCw, Car, LayoutDashboard,
  UserCircle, Truck, FileText,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// 섹션 정의
// ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'summary',      label: 'Executive Summary', icon: Target },
  { id: 'analysis',     label: '현황 분석',          icon: ClipboardList },
  { id: 'market',       label: '시장 분석',          icon: TrendingUp },
  { id: 'product',      label: '제품 정의',          icon: Layers },
  { id: 'spec',         label: '기능 명세 (전체)',    icon: ListChecks },
  { id: 'tech',         label: '기술 아키텍처',      icon: Code2 },
  { id: 'revenue',      label: '수익 모델',          icon: DollarSign },
  { id: 'gtm',          label: 'GTM 전략',           icon: Megaphone },
  { id: 'roadmap',      label: '개발 로드맵',        icon: Map },
  { id: 'finance',      label: '재무 계획',          icon: BarChart2 },
  { id: 'risk',         label: '리스크 관리',        icon: AlertTriangle },
  { id: 'team',         label: '팀 구성',            icon: Users },
];

// ─────────────────────────────────────────────────────────────
// 재사용 UI 조각
// ─────────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ icon: React.ElementType; title: string; subtitle?: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-4 mb-8">
    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>{children}</div>
);

const Badge: React.FC<{ label: string; color?: string }> = ({ label, color = 'bg-blue-100 text-blue-700' }) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>{label}</span>
);

const Check: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex items-start gap-2 text-sm text-slate-700">
    <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
    <span>{text}</span>
  </li>
);

const Cross: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex items-start gap-2 text-sm text-slate-500">
    <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
    <span>{text}</span>
  </li>
);

const Divider = () => <hr className="my-8 border-slate-100" />;

// ─────────────────────────────────────────────────────────────
// 섹션 컴포넌트들
// ─────────────────────────────────────────────────────────────

const SectionSummary = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2">
      <SectionTitle icon={Target} title="Executive Summary" subtitle="ClassSync — 모든 강습 기반 학원의 운영을 하나의 플랫폼으로" />
    </div>

    <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-0 text-white">
      <p className="text-lg font-semibold mb-1">한 줄 정의</p>
      <p className="text-2xl font-bold">"축구부터 필라테스까지 — 모든 강습 기반 학원의 운영을 하나의 플랫폼으로"</p>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> 문제 정의</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          대한민국 약 <strong>10만여 개</strong>의 체육·예능 학원(수영, 축구, 필라테스, 발레, 테니스, 골프, 태권도, 음악, 미술 등)은 여전히
          엑셀, 카카오톡, 개인 메모장으로 원생을 관리합니다. 기존 SaaS는 <strong>종목별 운영 특성 차이를 반영하지 못하고</strong>,
          강사 앱·학부모 앱·관리자 웹의 삼위일체 경험을 완성하지 못했습니다.
        </p>
      </Card>
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Zap size={16} className="text-blue-500" /> 솔루션</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong>ClassSync</strong>는 종목에 구애받지 않는 <strong>Configurable Module Architecture</strong> 기반의 학원 관리 SaaS입니다.
          수영, 축구, 필라테스, 발레, 테니스, 골프, 태권도, 음악, 미술 — 어떤 종목이든 <strong>10분 이내</strong>에 설정을 마치고 운영을 시작할 수 있습니다.
        </p>
      </Card>
    </div>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">핵심 차별화 포인트 — ClassSync vs 통통통</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 text-slate-500 font-medium w-1/4">구분</th>
              <th className="text-left py-2 px-3 text-slate-500 font-medium w-1/3">통통통 (경쟁사)</th>
              <th className="text-left py-2 px-3 text-blue-600 font-medium w-1/3">ClassSync (우리)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[
              ['종목 지원', '일반 학원 (수강 형태)', '강습 기반 전 종목 (레벨/그룹/개인)'],
              ['앱 경험', '학부모 앱 기본 제공', '강사 앱 + 학부모 앱 + 관리자 웹 풀 지원'],
              ['일정 관리', '기본 수납/출결', '보강·결석·레벨 이동·그룹 분반 자동화'],
              ['AI 기능', '없음', '레벨 진단 보조, 자동 알림, 인사이트 리포트'],
              ['가격 투명성', '견적 문의 방식', '공개 요금제 (Freemium → Pro → Enterprise)'],
              ['멀티지점', 'FC 기능 별도 과금', 'Pro부터 3지점 기본 포함'],
            ].map(([구분, competitor, ours]) => (
              <tr key={구분} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-medium text-slate-700">{구분}</td>
                <td className="py-2.5 px-3 text-slate-500">{competitor}</td>
                <td className="py-2.5 px-3 text-blue-700 font-medium">{ours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

const SectionAnalysis = () => (
  <div className="space-y-6">
    <SectionTitle icon={ClipboardList} title="현황 분석" subtitle="기존 SwimSync 코드베이스 & 경쟁사 벤치마킹" />

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Code2 size={16} className="text-purple-500" /> 현재 기술 스택</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'React 19', sub: 'Frontend Framework', color: 'bg-blue-50 border-blue-200' },
          { label: 'TypeScript 5.8', sub: '타입 안전성', color: 'bg-indigo-50 border-indigo-200' },
          { label: 'Vite 6', sub: 'Build Tool', color: 'bg-violet-50 border-violet-200' },
          { label: 'Tailwind CSS 4', sub: 'Styling', color: 'bg-cyan-50 border-cyan-200' },
          { label: 'date-fns 4', sub: '날짜 처리 (한국어)', color: 'bg-emerald-50 border-emerald-200' },
          { label: 'Supabase', sub: 'Postgres + Auth + RLS (백엔드, 연동 진행 중)', color: 'bg-teal-50 border-teal-200' },
          { label: 'Google GenAI SDK', sub: '설치됨 (미연동)', color: 'bg-amber-50 border-amber-200' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
            <div className="font-semibold text-slate-800 text-sm">{item.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
          </div>
        ))}
      </div>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> 구현 완료 기능</h3>
        <ul className="space-y-2">
          <Check text="Supabase 기반 인증 (이메일/비밀번호 + Google 로그인)" />
          <Check text="조직(organizations)·멤버십(organization_members) 멀티테넌시 스키마 + RLS 정책" />
          <Check text="가입 시 개인 프리랜서 조직 자동 생성 (Postgres 트리거)" />
          <Check text="학생 다중 반 등록 — 반마다 담당쌤·요일·시간을 개별 관리, 휴학·종강·등록취소" />
          <Check text="반별 수납 이력 원장 + 학부모 앱 결제 시뮬레이션 플로우" />
          <Check text="직원 관리 페이지 (인사정보·근무요일·시간, 강사 전용 항목 분기)" />
          <Check text="보강 승인 시 구분(유치부/정규반/성인반) 일치 강제 매칭" />
          <Check text="차량 노선별/시간별 등하원 관리 — 다중 반 등록 학생도 정확히 반영" />
          <Check text="엑셀/CSV 학생 일괄 등록" />
          <Check text="페이지별 인앱 사용법 가이드 (최초 진입 시 자동 표시)" />
          <Check text="정기 상담 기록 관리 — 강사 앱 작성 → 관리자 상담 관리 페이지 실시간 연동, 월별 조회, 상담 주기 학원별 설정" />
          <Check text="학부모↔강사 1:1 채팅 + 전화 연결 + 통화 메모 (같은 세션 내 실시간 동기화)" />
          <Check text="일정 변경 요청 — 요일/시간/수강 횟수 변경 신청, 재등록 기간(학원별 설정) 규칙 적용, 승인 시 반 등록정보 자동 반영" />
          <Check text="보강 취소 + 벨소리 알림 — 신규·체험 문의로 정원이 필요할 때 보강 자리 회수, 학부모·강사 앱에 즉시 알림" />
          <Check text="수업 상세에 차량·호차·픽업/드롭 지점 통합 표시" />
        </ul>
      </Card>
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><XCircle size={16} className="text-red-400" /> 남은 과제</h3>
        <ul className="space-y-2">
          <Cross text="수영 종목 하드코딩 → Sport Config Layer 아직 미착수" />
          <Cross text="화면 상태가 아직 React Context in-memory — Supabase 데이터 레이어 실연동 전" />
          <Cross text="실제 카드결제(PG) 미연동 — 결제는 시뮬레이션 처리" />
          <Cross text="카카오 알림톡 / SMS 게이트웨이 미연동 — 앱 내 공지만 가능" />
          <Cross text="강사·학부모·기사 앱이 아직 네이티브 앱이 아닌 반응형 웹 미리보기" />
          <Cross text="세금계산서·가상계좌·카드단말기·포인트·형제자매 연결 등 미구현" />
          <Cross text="보강 시 차량 이용 희망 케이스 — 정책/UI 설계 필요 (아래 리스크 관리 참고)" />
        </ul>
      </Card>
    </div>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Building2 size={16} className="text-slate-500" /> 통통통 전략적 약점 분석</h3>
      <div className="space-y-3">
        {[
          { weak: '가격 불투명성', detail: 'Pro 요금 비공개, 견적 문의 방식', counter: '공개 요금제로 신뢰 확보 → 즉시 구독 전환' },
          { weak: '종목 범용성 한계', detail: '일반 학원 중심, 체육 특화 기능 부족', counter: '종목별 설정 템플릿 제공 (수영·축구·필라테스 등)' },
          { weak: '강사 앱 빈약', detail: '출결 중심, 수업 관리 기능 미흡', counter: '강사 중심 UX로 출결·진도·보강 완전 자동화' },
          { weak: 'AI 기능 부재', detail: '단순 데이터 관리에 그침', counter: '이탈 예측·레벨 진단·자동 보고서 (Pro+)' },
        ].map(row => (
          <div key={row.weak} className="flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-lg bg-slate-50">
            <div className="w-32 flex-shrink-0">
              <Badge label={row.weak} color="bg-red-100 text-red-700" />
            </div>
            <div className="flex-1 text-sm text-slate-500">{row.detail}</div>
            <ArrowRight size={14} className="text-slate-300 hidden md:block flex-shrink-0" />
            <div className="flex-1 text-sm text-blue-700 font-medium">{row.counter}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const SectionMarket = () => (
  <div className="space-y-6">
    <SectionTitle icon={TrendingUp} title="시장 분석 & 기회" subtitle="대한민국 체육·예능 학원 SaaS 시장" />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { label: 'TAM', sub: '총 잠재 시장', value: '연 7,200억원', detail: '전국 체육·예능 학원 ~12만 개', color: 'from-slate-700 to-slate-900' },
        { label: 'SAM', sub: '실질 접근 시장', value: '연 2,880억원', detail: '디지털화 의향 학원 40%', color: 'from-blue-600 to-blue-800' },
        { label: 'SOM', sub: '3년 목표 시장', value: '연 144억원', detail: 'SAM 5% 점유 (약 2,400개)', color: 'from-indigo-500 to-indigo-700' },
      ].map(m => (
        <div key={m.label} className={`rounded-xl bg-gradient-to-br ${m.color} text-white p-5`}>
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{m.label}</div>
          <div className="text-sm opacity-80 mb-2">{m.sub}</div>
          <div className="text-2xl font-bold mb-1">{m.value}</div>
          <div className="text-xs opacity-60">{m.detail}</div>
        </div>
      ))}
    </div>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">종목별 시장 기회</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 text-slate-500 font-medium">종목</th>
              <th className="text-left py-2 px-3 text-slate-500 font-medium">추정 학원 수</th>
              <th className="text-left py-2 px-3 text-slate-500 font-medium">디지털화 현황</th>
              <th className="text-left py-2 px-3 text-slate-500 font-medium">특이 요구사항</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[
              ['수영', '~3,000개', '낮음', '레인 배정, 레벨 테스트', 'bg-blue-50'],
              ['축구·풋살', '~8,000개', '매우 낮음', '포지션, 팀 편성, 경기 일정', 'bg-green-50'],
              ['필라테스', '~12,000개', '중간', '기구 예약, 1:1 세션', 'bg-pink-50'],
              ['발레·댄스', '~5,000개', '낮음', '공연 관리, 의상 사이즈', 'bg-purple-50'],
              ['태권도·무술', '~15,000개', '중간', '품새 단계, 승급 심사', 'bg-red-50'],
              ['음악 (피아노 등)', '~25,000개', '낮음', '개인 레슨, 악보 관리', 'bg-yellow-50'],
              ['골프', '~4,500개', '중간', '타석 배정, 스윙 영상', 'bg-emerald-50'],
              ['미술', '~8,000개', '매우 낮음', '작품 포트폴리오, 전시', 'bg-orange-50'],
            ].map(([종목, 수, 현황, 요구, bg]) => (
              <tr key={종목} className={`hover:${bg} transition-colors`}>
                <td className="py-2.5 px-3 font-medium text-slate-800">{종목}</td>
                <td className="py-2.5 px-3 text-slate-600">{수}</td>
                <td className="py-2.5 px-3">
                  <Badge
                    label={현황}
                    color={현황 === '매우 낮음' ? 'bg-red-100 text-red-700' : 현황 === '낮음' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
                  />
                </td>
                <td className="py-2.5 px-3 text-slate-500 text-xs">{요구}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">타깃 고객 세그먼트</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { seg: 'Segment 1', name: '소형 학원', size: '원생 30명 이하', pain: '엑셀·카카오톡 사용, 보강 관리 혼란', plan: 'Free → Basic', color: 'border-slate-200' },
          { seg: 'Segment 2', name: '중형 학원', size: '원생 30~150명', pain: '시간표 충돌, 강사 간 소통 비효율', plan: 'Pro', color: 'border-blue-200' },
          { seg: 'Segment 3', name: '대형·프랜차이즈', size: '원생 150명+ / 다지점', pain: '지점별 데이터 사일로, 표준화 부재', plan: 'Enterprise', color: 'border-indigo-200' },
          { seg: 'Segment 4', name: '스포츠 클럽·협회', size: '팀 단위 운영', pain: '대회 일정, 선수 관리, 부모 소통', plan: 'Pro / Enterprise', color: 'border-purple-200' },
        ].map(s => (
          <div key={s.seg} className={`rounded-lg border-2 ${s.color} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">{s.seg}</span>
              <Badge label={s.plan} color="bg-blue-100 text-blue-700" />
            </div>
            <div className="font-semibold text-slate-800">{s.name}</div>
            <div className="text-xs text-slate-500 mb-2">{s.size}</div>
            <div className="text-sm text-slate-600 flex items-start gap-1.5">
              <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
              {s.pain}
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const SectionProduct = () => (
  <div className="space-y-6">
    <SectionTitle icon={Layers} title="제품 정의 — ClassSync" subtitle={"핵심 철학: \"Configure, Don't Code\""} />

    <Card className="bg-slate-900 border-0 text-white">
      <div className="text-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-2">핵심 철학</p>
        <p className="text-xl font-bold">"Configure, Don't Code"</p>
        <p className="text-slate-400 text-sm mt-2">학원 원장이 코드를 몰라도, IT 담당자 없이도, 자신의 학원에 맞게 설정만으로 최적화된 운영 시스템을 구축할 수 있어야 한다.</p>
      </div>
    </Card>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-5">종목 설정 레이어 — 핵심 혁신</h3>
      <p className="text-sm text-slate-500 mb-4">학원 최초 설정 시 종목을 선택하면, 해당 종목에 최적화된 UI·레이블·워크플로우가 자동 적용됩니다.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            sport: '수영', emoji: '🏊',
            items: ['레벨: 물 적응 → 초급 → 중급 → 고급 → 선수반', '시설 단위: 레인', '수강권: 주2회/주3회/자유이용', '평가: 발차기·자유형·배영·평영·접영'],
            color: 'border-blue-300 bg-blue-50',
          },
          {
            sport: '축구', emoji: '⚽',
            items: ['레벨: 유아부 → 초급 → 중급 → 고급 → 엘리트', '시설 단위: 구장', '커스텀: 포지션·등번호', '특수 기능: 경기 일정·팀 편성'],
            color: 'border-green-300 bg-green-50',
          },
          {
            sport: '필라테스', emoji: '🧘',
            items: ['레벨: 입문 → 초급 → 중급 → 고급', '시설 단위: 기구(Reformer)', '수강권: 횟수권/월정액', '커스텀: 기구번호·목표부위'],
            color: 'border-pink-300 bg-pink-50',
          },
        ].map(s => (
          <div key={s.sport} className={`rounded-lg border-2 ${s.color} p-4`}>
            <div className="text-2xl mb-2">{s.emoji}</div>
            <div className="font-bold text-slate-800 mb-3">{s.sport} 학원</div>
            <ul className="space-y-1.5">
              {s.items.map(item => <li key={item} className="text-xs text-slate-600 flex gap-1.5"><ChevronRight size={12} className="flex-shrink-0 mt-0.5 text-slate-400" />{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Card>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-1">핵심 모듈 구성</h3>
      <p className="text-xs text-slate-400 mb-5">완료 = 지금 앱에서 실제로 동작 · 부분 = 시뮬레이션/수동으로 동작 중 · 예정 = 아직 미착수</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, name: '원생 관리', desc: '다중 반 등록 포함 생애주기 전 과정', color: 'text-blue-600 bg-blue-50', status: '완료' as const },
          { icon: Calendar, name: '스케줄링', desc: '보강 자동화 + 구분별 매칭', color: 'text-purple-600 bg-purple-50', status: '완료' as const },
          { icon: IdCard, name: '직원 관리', desc: '인사정보·근무조건', color: 'text-violet-600 bg-violet-50', status: '완료' as const },
          { icon: CreditCard, name: '수납 관리', desc: '반별 원장 + 결제 시뮬레이션', color: 'text-amber-600 bg-amber-50', status: '부분' as const },
          { icon: CheckCircle, name: '출결 관리', desc: '수동 출결 (QR 자동화는 예정)', color: 'text-emerald-600 bg-emerald-50', status: '부분' as const },
          { icon: Bell, name: '알림 엔진', desc: '앱 내 공지 (카카오·SMS는 예정)', color: 'text-red-600 bg-red-50', status: '부분' as const },
          { icon: HelpCircle, name: '인앱 가이드', desc: '페이지별 사용법 자동 안내', color: 'text-teal-600 bg-teal-50', status: '완료' as const },
          { icon: MessageSquareText, name: '상담 관리', desc: '강사 앱 연동 + 월별 조회 + 주기 설정', color: 'text-fuchsia-600 bg-fuchsia-50', status: '완료' as const },
          { icon: CalendarClock, name: '일정 변경 요청', desc: '재등록 기간 규칙 기반 승인 흐름', color: 'text-orange-600 bg-orange-50', status: '완료' as const },
          { icon: Users, name: '학부모↔강사 메시징', desc: '채팅 + 전화 + 통화 메모', color: 'text-rose-600 bg-rose-50', status: '완료' as const },
          { icon: Smartphone, name: '강사/학부모/기사 앱', desc: '현재 웹 미리보기, 네이티브 전환 예정', color: 'text-cyan-600 bg-cyan-50', status: '부분' as const },
          { icon: BarChart2, name: '원장 대시보드', desc: '핵심 지표 한눈에', color: 'text-slate-600 bg-slate-50', status: '예정' as const },
          { icon: Cpu, name: 'AI 인사이트', desc: '이탈 예측·레벨 진단', color: 'text-indigo-600 bg-indigo-50', status: '예정' as const },
        ].map(m => (
          <div key={m.name} className="rounded-lg border border-slate-100 p-3 text-center hover:shadow-sm transition-shadow relative">
            <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              m.status === '완료' ? 'bg-emerald-100 text-emerald-700' : m.status === '부분' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>{m.status}</span>
            <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center mx-auto mb-2 mt-2`}>
              <m.icon size={18} />
            </div>
            <div className="font-semibold text-slate-800 text-sm">{m.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
          </div>
        ))}
      </div>
    </Card>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-1">사용자 역할 & 플랫폼</h3>
      <p className="text-xs text-slate-400 mb-4">Manager 역할과 네이티브 앱은 아직 로드맵 단계 — 현재는 Owner/Instructor 2단 구조 + 웹 미리보기로 동작해요.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">역할 정의 (구현 상태)</p>
          <div className="space-y-2">
            {[
              { role: 'Owner (원장)', desc: '조직 데이터 + 설정 전체 관리 — 구현 완료 (organization_members.role = owner)', color: 'bg-indigo-100 text-indigo-700' },
              { role: 'Instructor (강사)', desc: '담당 수업·학생·진도 관리, 초대→수락 흐름 — 구현 완료', color: 'bg-cyan-100 text-cyan-700' },
              { role: 'Manager (부원장)', desc: '원생·스케줄·출결 관리 — 아직 별도 역할로 분리되지 않음 (예정)', color: 'bg-slate-100 text-slate-500' },
              { role: 'Parent (학부모)', desc: '내 아이 조회·보강·결제 — 웹 미리보기로 구현 완료 (별도 로그인 계정 연동은 예정)', color: 'bg-emerald-100 text-emerald-700' },
            ].map(r => (
              <div key={r.role} className="flex items-center gap-3">
                <Badge label={r.role} color={r.color} />
                <span className="text-sm text-slate-500">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">플랫폼 구성 (구현 상태)</p>
          <div className="space-y-2">
            {[
              { platform: 'Admin Web (반응형)', who: 'Owner 주 사용 — 구현 완료' },
              { platform: '강사/학부모/기사 웹 미리보기', who: '관리자 화면 내 미리보기로 구현 완료' },
              { platform: 'iOS / Android 네이티브 앱', who: '강사·학부모·기사용 — 아직 미착수 (예정)' },
              { platform: 'iPad 전용 출결 모드', who: '수업 중 출결 체크 전용 — 예정' },
            ].map(p => (
              <div key={p.platform} className="flex items-center gap-2 text-sm">
                <Smartphone size={14} className="text-slate-400" />
                <span className="font-medium text-slate-700">{p.platform}</span>
                <span className="text-slate-400">— {p.who}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  </div>
);

// 페이지별 기능 명세 — 이 문서만 보고도 개발자가 전체 시스템 구조와 각 화면의 동작을 파악할 수 있도록
// 실제 구현된 코드(App.tsx 내비게이션 + 각 컴포넌트) 기준으로 작성함
const ADMIN_PAGES = [
  {
    icon: LayoutDashboard, name: '스케줄 관리', file: 'AdminSchedule.tsx',
    desc: '전체 강습 스케줄과 수영장 일정을 관리하는 메인 화면.',
    features: [
      '월/주/일 3단 캘린더 뷰, 강사 필터(전체/개인)',
      '일정 추가(특강·휴강·메모), 시스템 설정(학원명·지점명·지정 시간대)',
      '수업 칸 클릭 → 상세 모달: 학생별 나이/수준/주소/수강권/진도/구분(정규·보강·결석)/차량·호차/타는곳·내리는곳/특이사항, 정원(N/N명) 표시',
      '보강 취소: 정원이 찼는데 신규·체험 문의가 들어온 경우 보강 학생을 취소해 자리 확보 → 학부모 앱·강사 앱에 벨소리 알림 발송',
    ],
  },
  {
    icon: Users, name: '강습생 관리', file: 'AdminStudents.tsx',
    desc: '학생 등록부터 다중 반, 수납까지 학생 데이터의 중심 허브.',
    features: [
      '강습반별 보기 / 전체 목록, 검색(이름·번호·전화번호), 강습반 자체 관리(이름·정원)',
      '엑셀/CSV 일괄 등록, 신규 등록(원생/모/부 연락처 분리 + SMS 수신 대상 지정)',
      '반 등록정보: 다중 반 등록/수정(담당쌤·요일·시간 변경), 휴학·종강·등록취소, 정원 실시간 확인',
      '수납 내역: 반별 월별 원장, "이번 달 청구 생성", 개별 수납 처리(카드/현금/계좌이체)',
    ],
  },
  {
    icon: IdCard, name: '직원 관리', file: 'AdminStaff.tsx',
    desc: '강사·일반 직원의 인사 정보 관리.',
    features: [
      '재직/퇴직/전체 필터, 신규 직원 입력·삭제',
      '연락처·입사일·직책·부서·업무구분·고용형태·근무요일/시간·비고',
      '업무구분이 "강사"인 경우만 스케줄 색상·1타임 정원 필드 노출',
    ],
  },
  {
    icon: MessageSquareText, name: '상담 관리', file: 'AdminCounseling.tsx',
    desc: '강사별 담당 학생의 정기 상담 현황·일지를 관리. 강사 앱과 실시간 연동.',
    features: [
      '정기 상담 주기(1/2/3개월) 관리자 설정 → "다음 상담 예정일" 자동 계산',
      '강사별 그룹 뷰: 학생별 최근 상담일/다음 예정일/상태(완료·필요) 뱃지',
      '월별 보기(달력 이동)로 특정 달에 진행된 상담만 필터링, "상담 필요만 보기" 필터',
      '학생 펼치기 → 상담 일지(일자+내용) 이력 전체, 관리자도 직접 기록 추가 가능',
    ],
  },
  {
    icon: CreditCard, name: '결제 관리', file: 'AdminPayments.tsx',
    desc: '수강 플랜 설계와 결제 현황, 보강 정책 관리.',
    features: [
      '요약: 이번 달 수납액/미수납액/수강 중 총원',
      '수강 플랜 CRUD(아동/성인, 주 횟수, 자유수영 포함 여부, 월 수강료)',
      '보강 가능 횟수 정책(주당 횟수별 최대 보강 횟수), 아동/성인 서류 필요 여부 설정',
    ],
  },
  {
    icon: RefreshCw, name: '보강 요청 관리', file: 'AdminMakeups.tsx',
    desc: '서류 기반(진단서 등) 보강·이월 요청의 승인 큐.',
    features: [
      '승인 대기/처리 완료 탭, 제출 서류 사진 확인',
      '보강 배정: 같은 구분(유치부/정규반/성인반)의 빈자리 중 선택해 확정',
      '이월 처리: 다음 달 결제 금액에서 회당 금액 자동 차감, 거절',
    ],
  },
  {
    icon: CalendarClock, name: '일정 변경 요청', file: 'AdminScheduleChanges.tsx',
    desc: '학부모가 신청한 요일·시간·수강 횟수 변경을 검토·승인.',
    features: [
      '재등록 기간(매월 며칠~며칠) 학원별 설정 → 수강 횟수가 바뀌는 요청은 이 기간에만 학부모가 신청 가능',
      '승인 대기/처리 완료 탭, 변경 전→후 비교 카드',
      '승인 시 해당 학생의 반 등록정보(Enrollment)에 즉시 반영되고 향후 수업이 재생성됨',
    ],
  },
  {
    icon: Bell, name: '공지 발송', file: 'AdminNotifications.tsx',
    desc: 'SMS/앱 푸시 공지 작성 및 발송.',
    features: [
      '공지 유형 템플릿, 수신 대상 개별/전체 선택',
      '임시 저장 vs 발송, 발송 내역(전체/발송 완료/임시 저장) 필터',
    ],
  },
  {
    icon: Car, name: '차량 관리', file: 'AdminVehicles.tsx',
    desc: '통학 차량·기사·탑승 학생, 일별 노선 관리.',
    features: [
      '기사 관리, 차량 노선 관리(차량별 탑승 학생 배정)',
      '일별 노선 관리: 요일별 실제 등하원 대상(다중 반 반영), 노선별/시간별 보기 전환',
    ],
  },
];

const APP_PAGES = [
  {
    icon: Smartphone, name: '강사 앱', file: 'InstructorApp.tsx',
    desc: '강사가 실제로 쓰게 될 모바일 화면의 미리보기.',
    features: [
      '오늘 일정 탭: 주간 날짜 스트립, 수업별 참석/결석 학생, 진도·특이사항 기록',
      '내 강습생 탭: 담당 학생 전체(다중 반 포함), 학생별 "상담 기록" 작성/이력 확인',
      '보강·이월 요청 탭: 내 학생의 요청 현황 확인(승인/거절은 관리자 웹에서)',
      '메시지 탭: 학생(학부모)별 1:1 채팅, 전화 연결, 통화 메모',
      '알림: 새로 배정된 보강 학생 알림 + 보강 취소 알림(벨소리)',
    ],
  },
  {
    icon: UserCircle, name: '학부모 앱', file: 'ParentApp.tsx',
    desc: '학부모가 실제로 쓰게 될 모바일 화면의 미리보기.',
    features: [
      '홈 탭: 다음 강습, 이번 달 출석 현황, 나의 진도, 결제 현황(카드/카카오페이/네이버페이 결제 시뮬레이션)',
      '내 수업 정보: 요일·시간·수강권 확인 + 변경 신청(재등록 기간 규칙 적용)',
      '결석/보강 신청 탭: 달력 기반 결석 신청, 결석일→보강일→시간 순 보강 신청(서류 필요 시 제출)',
      '메시지 탭: 담당 강사와 1:1 채팅, 전화 연결, 통화 메모',
      '알림: 보강 취소 알림(벨소리) + "보강 다시 신청하기" 바로가기',
    ],
  },
  {
    icon: Truck, name: '기사 앱', file: 'DriverApp.tsx',
    desc: '통학 차량 기사가 실제로 쓰게 될 모바일 화면의 미리보기.',
    features: [
      '오늘 노선 탭: 픽업 순서, 학생 탭하여 실제 전화 연결',
      '전체 탑승생 탭: 배정 학생과 요일·시간',
      '보강으로 결석 처리된 학생은 픽업 목록에서 자동 제외(보강은 차량 미운행 정책)',
    ],
  },
  {
    icon: FileText, name: '사업 기획서', file: 'BusinessPlan.tsx',
    desc: '지금 보고 있는 이 문서 — 시장 분석부터 기술 아키텍처, 재무 계획까지.',
    features: ['Executive Summary, 현황 분석, 시장 분석, 제품 정의, 기능 명세, 기술 아키텍처, 수익 모델, GTM 전략, 개발 로드맵, 재무 계획, 리스크 관리, 팀 구성'],
  },
];

const SectionSpec = () => (
  <div className="space-y-6">
    <SectionTitle icon={ListChecks} title="기능 명세 (전체)" subtitle="이 문서만 보고도 전체 시스템 구조와 각 화면의 동작을 파악할 수 있도록 작성한 상세 명세" />

    <Card className="bg-slate-900 border-0 text-white">
      <p className="text-sm leading-relaxed text-slate-300">
        아래는 왼쪽 사이드바 내비게이션 구조를 그대로 따른 페이지별 명세예요. 각 항목은 실제 코드 파일(<code className="text-cyan-300">src/components/*.tsx</code>)과 1:1로 대응하고,
        기능 목록은 그 화면에서 실제로 클릭·조작 가능한 것만 적었어요 (계획만 있고 미구현인 것은 "현황 분석"/"개발 로드맵" 쪽에 별도 표기).
      </p>
    </Card>

    <div>
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><LayoutGrid size={16} className="text-blue-500" /> 관리자 도구 (Admin Web)</h3>
      <div className="space-y-3">
        {ADMIN_PAGES.map(p => (
          <Card key={p.name}>
            <div className="flex items-start gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <p.icon size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">{p.name}</span>
                  <code className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{p.file}</code>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            </div>
            <ul className="space-y-1.5 pl-12">
              {p.features.map(f => <Check key={f} text={f} />)}
            </ul>
          </Card>
        ))}
      </div>
    </div>

    <div>
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Smartphone size={16} className="text-cyan-500" /> 앱 미리보기 (User Apps)</h3>
      <div className="space-y-3">
        {APP_PAGES.map(p => (
          <Card key={p.name}>
            <div className="flex items-start gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <p.icon size={16} className="text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">{p.name}</span>
                  <code className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{p.file}</code>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            </div>
            <ul className="space-y-1.5 pl-12">
              {p.features.map(f => <Check key={f} text={f} />)}
            </ul>
          </Card>
        ))}
      </div>
    </div>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Layers size={16} className="text-violet-500" /> 공유 데이터 모델 (핵심 엔티티)</h3>
      <p className="text-xs text-slate-500 mb-3">모든 화면은 하나의 <code className="text-slate-700 bg-slate-50 px-1 rounded">StoreContext</code>(현재 React Context, Supabase 전환 예정)를 공유해서 데이터 불일치 없이 동작해요.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {[
          'Student (+ Enrollment[])', 'Instructor', 'ClassSession', 'PaymentRecord', 'PaymentPlan',
          'MakeupRequest', 'MakeupCancellationNotice', 'ScheduleChangeRequest', 'CounselingRecord',
          'ChatMessage', 'NotificationRecord', 'Vehicle / Driver', 'AcademySettings',
        ].map(t => (
          <div key={t} className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 font-mono text-slate-600">{t}</div>
        ))}
      </div>
    </Card>
  </div>
);

const SectionTech = () => (
  <div className="space-y-6">
    <SectionTitle icon={Code2} title="기술 아키텍처" subtitle="확장 가능한 멀티테넌시 SaaS 구조" />

    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">전체 시스템 아키텍처</h3>
        <span className="text-xs text-slate-400">NestJS 자체 구축 대신 Supabase(BaaS)로 방향 확정</span>
      </div>
      <div className="space-y-2">
        {[
          { layer: 'Client Layer', items: ['Admin Web (React 19 + Vite, 완료)', '강사/학부모/기사 앱 — 반응형 웹 미리보기 (완료)', 'React Native 전환 (예정)'], color: 'bg-blue-50 border-blue-200 text-blue-800' },
          { layer: 'API / Auth Gateway', items: ['Supabase Auto REST + Realtime (PostgREST)', 'Supabase Auth — 이메일/비밀번호 + Google OAuth (완료)'], color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
          { layer: 'Backend Logic', items: ['Postgres 트리거 — 가입 시 개인 조직 자동 생성 (완료)', 'RLS 정책 함수 is_org_member() / is_org_owner() (완료)', '커스텀 서버 로직 없음 — 필요 시 Supabase Edge Functions 검토'], color: 'bg-purple-50 border-purple-200 text-purple-800' },
          { layer: 'Data Layer', items: ['Supabase Postgres — 조직·멤버십·학생·반·결제 스키마 설계 완료', 'React Context가 아직 in-memory 상태 (실시간 쿼리 연동 전)'], color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { layer: 'External Services (예정)', items: ['카카오 알림톡', 'SMS 게이트웨이', '토스페이먼츠 등 PG', 'FCM / APNs'], color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
        ].map((l, i) => (
          <div key={l.layer}>
            <div className={`rounded-lg border p-3 ${l.color}`}>
              <div className="font-semibold text-sm mb-1.5">{l.layer}</div>
              <div className="flex flex-wrap gap-2">
                {l.items.map(item => (
                  <span key={item} className="text-xs bg-white/70 rounded px-2 py-0.5 border border-current/20">{item}</span>
                ))}
              </div>
            </div>
            {i < 4 && <div className="flex justify-center my-1"><ChevronRight size={14} className="text-slate-300 rotate-90" /></div>}
          </div>
        ))}
      </div>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4">기술 스택 선정 (현재 확정)</h3>
        <div className="space-y-3">
          {[
            { cat: 'Web Frontend', items: 'React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 (사용 중)' },
            { cat: 'Backend / Auth', items: 'Supabase — PostgreSQL + Auth + Realtime + Storage (사용 중, NestJS 대신 채택)' },
            { cat: 'Database', items: 'Supabase Postgres · Row Level Security (RLS) 정책' },
            { cat: 'Mobile App', items: '현재 React 반응형 웹 미리보기 · React Native 전환은 검토 단계' },
            { cat: 'Infrastructure', items: 'Vercel (프론트엔드 배포 예정) · GitHub (버전 관리, 연동 완료) · Supabase Cloud' },
          ].map(s => (
            <div key={s.cat}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.cat}</div>
              <div className="text-sm text-slate-700 bg-slate-50 rounded px-3 py-1.5">{s.items}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> 멀티테넌시 & 보안</h3>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="font-semibold text-emerald-800 mb-1">Row Level Security (RLS) — 구현 완료</div>
            <p className="text-xs">organizations(조직) · organization_members(멤버십) 테이블 + is_org_member()/is_org_owner() 함수 기반 RLS 정책으로 조직 간 데이터 완전 격리</p>
          </div>
          <ul className="space-y-2">
            <Check text="Supabase Auth 세션 기반 인증 — 이메일/비밀번호 + Google 로그인 (완료)" />
            <Check text="가입 시 개인 프리랜서 조직 자동 생성 트리거 (완료)" />
            <Check text="조직 멤버십 역할: 원장(owner) / 강사(instructor), 초대(invited)→수락(active) 흐름 (완료)" />
            <Cross text="카카오/SMS 등 추가 로그인·알림 수단 — 별도 사업자 등록 후 연동 예정" />
            <Cross text="정보보안 책임보험, 자체 암호화 감사 — 정식 서비스화 시점에 진행 예정" />
          </ul>
        </div>
        <Divider />
        <h3 className="font-semibold text-slate-800 mb-3">SwimSync → ClassSync 마이그레이션</h3>
        <div className="space-y-2">
          {[
            { phase: 'Phase 1', desc: 'Supabase 인증 + 멀티테넌시 스키마 + RLS 설계 — 완료', done: true },
            { phase: 'Phase 2', desc: 'StoreContext(in-memory) → Supabase 실시간 쿼리 전환 — 진행 예정', done: false },
            { phase: 'Phase 3', desc: '수영 하드코딩 → Sport Config Layer — 예정', done: false },
            { phase: 'Phase 4', desc: 'React Native 강사/학부모/기사 앱 — 예정', done: false },
          ].map(p => (
            <div key={p.phase} className="flex items-center gap-2 text-sm">
              <Badge label={p.phase} color={p.done ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'} />
              <span className="text-slate-600">{p.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

const SectionRevenue = () => (
  <div className="space-y-6">
    <SectionTitle icon={DollarSign} title="수익 모델" subtitle="공개 요금제 Freemium + 멀티레이어 부가 수익" />

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        {
          plan: 'Free',
          price: '₩0',
          unit: '/월',
          desc: '시장 침투 & 네트워크 효과',
          features: ['원생 최대 30명', '강사 최대 2명', '기본 스케줄·출결', 'SMS 월 50건 포함', '학부모 앱 기본'],
          limits: ['수납 관리 수동 기록만', '멀티지점 불가', 'AI 기능 없음'],
          color: 'border-slate-200',
          badge: '',
        },
        {
          plan: 'Basic',
          price: '₩49,000',
          unit: '/월',
          desc: '소형 학원 핵심 니즈',
          features: ['원생 최대 100명', '강사 최대 5명', '보강 자동화', 'QR 자동 출결', '온라인 결제 연동', 'SMS 월 300건'],
          limits: ['멀티지점 불가', 'AI 기능 없음'],
          color: 'border-blue-200',
          badge: '',
        },
        {
          plan: 'Pro',
          price: '₩99,000',
          unit: '/월',
          desc: '중형 학원 풀 자동화',
          features: ['원생 최대 500명', '강사 최대 20명', '멀티지점 3개', 'SMS 무제한', '강사 급여 정산', 'AI 인사이트 기본', '성적표 빌더'],
          limits: [],
          color: 'border-indigo-400 ring-2 ring-indigo-300',
          badge: '추천',
        },
        {
          plan: 'Enterprise',
          price: '₩300,000+',
          unit: '/월~',
          desc: '대형·프랜차이즈',
          features: ['원생·강사 무제한', '멀티지점 무제한', '화이트라벨', 'AI 풀 기능', 'API 접근', '전담 CSM', 'SLA 99.9%'],
          limits: [],
          color: 'border-slate-900 bg-slate-900',
          badge: '견적 문의',
        },
      ].map(p => (
        <div key={p.plan} className={`rounded-xl border-2 ${p.color} p-5 relative flex flex-col`}>
          {p.badge && (
            <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-0.5 rounded-full ${p.plan === 'Pro' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'}`}>{p.badge}</span>
          )}
          <div className={p.plan === 'Enterprise' ? 'text-white' : 'text-slate-900'}>
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${p.plan === 'Enterprise' ? 'text-slate-400' : 'text-slate-400'}`}>{p.plan}</div>
            <div className="text-2xl font-bold">{p.price}<span className={`text-sm font-normal ${p.plan === 'Enterprise' ? 'text-slate-400' : 'text-slate-400'}`}>{p.unit}</span></div>
            <div className={`text-xs mt-1 mb-4 ${p.plan === 'Enterprise' ? 'text-slate-400' : 'text-slate-500'}`}>{p.desc}</div>
            <ul className="space-y-1.5 mb-3">
              {p.features.map(f => (
                <li key={f} className={`flex items-start gap-1.5 text-xs ${p.plan === 'Enterprise' ? 'text-slate-300' : 'text-slate-600'}`}>
                  <CheckCircle size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
              {p.limits.map(f => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-slate-400">
                  <XCircle size={12} className="text-slate-300 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">부가 수익원 (Add-on Revenue)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { icon: Bell, title: 'SMS/알림톡 초과 과금', desc: 'Free 초과 건당 ₩20 · Basic 초과 건당 ₩15 · Pro 무제한', color: 'bg-amber-50 border-amber-200' },
          { icon: CreditCard, title: '온라인 결제 수수료', desc: '수강료 결제금액의 1.5% 수취 (PG사 원가 제외 약 0.3~0.7% 마진)', color: 'bg-emerald-50 border-emerald-200' },
          { icon: Package, title: '부가 모듈 구독', desc: '영상 분석 ₩30K · 성적표 빌더+ ₩20K · 채용 공고 ₩50K/건', color: 'bg-blue-50 border-blue-200' },
          { icon: Code2, title: '맞춤 개발 용역', desc: '전용 성적표 디자인 ₩50~200만 · 외부 시스템 연동 별도 협의', color: 'bg-purple-50 border-purple-200' },
        ].map(item => (
          <div key={item.title} className={`rounded-lg border p-4 ${item.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <item.icon size={15} className="text-slate-500" />
              <span className="font-semibold text-slate-800 text-sm">{item.title}</span>
            </div>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const SectionGTM = () => (
  <div className="space-y-6">
    <SectionTitle icon={Megaphone} title="Go-to-Market 전략" subtitle="수직 론칭 → 수평 확장 → 생태계 구축" />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { phase: 'Phase 0', period: '런칭 전', title: '시드 고객 확보', items: ['지인 네트워크 통한 학원 직접 컨택', '20개 파일럿 학원 모집', '베타 테스터 혜택: 6개월 무료 Pro', '성공 사례(케이스 스터디) 제작'], color: 'bg-slate-50 border-slate-200' },
        { phase: 'Phase 1', period: '0~3개월', title: '수직 론칭 (수영+필라테스)', items: ['기존 SwimSync 코드 즉시 활용', '수영연맹·필라테스 협회 파트너십', '업종별 카카오 오픈채팅 마케팅', 'Free 플랜 퍼블릭 베타 런칭'], color: 'bg-blue-50 border-blue-200' },
        { phase: 'Phase 2', period: '3~6개월', title: '수평 확장 (전 종목)', items: ['축구→태권도→발레→음악·미술 순 확장', '각 종목 협회/단체 파트너십', 'Basic 플랜 정식 출시', '레퍼럴 프로그램 운영'], color: 'bg-indigo-50 border-indigo-200' },
      ].map(p => (
        <div key={p.phase} className={`rounded-xl border ${p.color} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <Badge label={p.phase} color="bg-slate-200 text-slate-700" />
            <span className="text-xs text-slate-400">{p.period}</span>
          </div>
          <div className="font-semibold text-slate-800 mb-3">{p.title}</div>
          <ul className="space-y-1.5">
            {p.items.map(item => <Check key={item} text={item} />)}
          </ul>
        </div>
      ))}
    </div>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">마케팅 채널</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { ch: '디지털 마케팅', icon: Globe, items: ['SEO: "학원 관리 프로그램" 키워드', '네이버 광고: 학원 원장 타깃', '유튜브: "학원 운영 꿀팁" 콘텐츠', '인스타그램: 필라테스·댄스 원장 타깃'] },
          { ch: '파트너십', icon: Building2, items: ['수영연맹, 대한축구협회 유소년', '대한태권도협회 파트너', '소상공인 디지털화 지원 사업', '토스페이먼츠 합작 마케팅'] },
          { ch: '레퍼럴 프로그램', icon: Users, items: ['학원 원장이 다른 원장 소개 시 양측 1개월 무료', '원장 커뮤니티 내 바이럴 효과 기대', '리워드 현금 전환 옵션 (Pro 이상)'] },
          { ch: '고객 성공 (CS)', icon: Star, items: ['Day 1: 종목별 맞춤 튜토리얼', 'Day 3: 엑셀 데이터 이전 지원', 'Day 7: 첫 수업 출결 완료 확인', '월간 운영 인사이트 리포트 발송'] },
        ].map(c => (
          <div key={c.ch} className="rounded-lg border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <c.icon size={15} className="text-blue-500" />
              <span className="font-semibold text-slate-800 text-sm">{c.ch}</span>
            </div>
            <ul className="space-y-1.5">
              {c.items.map(item => <Check key={item} text={item} />)}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const SectionRoadmap = () => (
  <div className="space-y-6">
    <SectionTitle icon={Map} title="개발 로드맵" subtitle="12개월 3단계 개발 계획" />

    {[
      {
        phase: 'Phase 1: Foundation', period: 'M1~M3', color: 'border-blue-300 bg-blue-50',
        badgeColor: 'bg-blue-600 text-white',
        milestones: [
          { month: 'M1', title: '백엔드 기반 구축 (완료)', items: ['Supabase 프로젝트 + 스키마 설계 (완료)', 'organizations/organization_members 멀티테넌시 + RLS (완료)', 'Supabase Auth 이메일·Google 로그인 (완료)', '가입 시 개인 조직 자동 생성 트리거 (완료)'] },
          { month: 'M2', title: '핵심 기능 + 프론트 연결', items: ['로그인/회원가입 UI + 조직 전환(OrgSwitcher) (완료)', '직원 관리·다중 반 등록·수납 원장·페이지 가이드 (완료, 로드맵보다 선반영)', '원생·강사·스케줄·출결·보강 CRUD를 Supabase 실시간 쿼리로 교체 (진행 예정)', 'React Context → Supabase 데이터 레이어 전환 (진행 예정)'] },
          { month: 'M3', title: 'Sport Config + Free 런칭', items: ['종목 설정 레이어 구현 (예정)', '수영·필라테스 템플릿 완성 (예정)', '학부모·강사·기사 앱 React Native MVP (예정)', 'Free 플랜 퍼블릭 베타 런칭 (예정)'] },
        ],
      },
      {
        phase: 'Phase 2: Growth', period: 'M4~M6', color: 'border-emerald-300 bg-emerald-50',
        badgeColor: 'bg-emerald-600 text-white',
        milestones: [
          { month: 'M4', title: '수납 + 온라인 결제', items: ['토스페이먼츠 결제 연동', '수강권 관리 (횟수권·기간권)', '자동 청구서 + 납입증명서 PDF'] },
          { month: 'M5', title: '알림 시스템', items: ['FCM (iOS/Android 푸시)', '카카오 알림톡 연동', 'NHN Cloud SMS', '자동 알림 스케줄러 (BullMQ)'] },
          { month: 'M6', title: 'Basic 플랜 정식 런칭', items: ['결제 시스템 + 요금제 관리', 'QR 코드 자동 출결', '원장 대시보드 핵심 지표', '축구·발레·태권도 종목 추가'] },
        ],
      },
      {
        phase: 'Phase 3: Scale', period: 'M7~M12', color: 'border-purple-300 bg-purple-50',
        badgeColor: 'bg-purple-600 text-white',
        milestones: [
          { month: 'M7~M8', title: 'Pro 플랜 기능', items: ['멀티지점 통합 대시보드', '강사 급여 자동 정산', '고급 매출 리포트', '성적표 빌더 + 1:1 채팅'] },
          { month: 'M9~M10', title: 'AI 기능', items: ['Claude / GenAI API 연동', '이탈 위험 원생 예측', 'AI 진도 보고서 초안 생성', '학부모 앱 FAQ 챗봇'] },
          { month: 'M11~M12', title: 'Enterprise + 생태계', items: ['화이트라벨 + 외부 API 공개', '채용 공고 플랫폼 기능', '음악·미술·골프·테니스 종목 추가', 'Series A 준비'] },
        ],
      },
    ].map(ph => (
      <div key={ph.phase} className={`rounded-xl border-2 ${ph.color} p-5`}>
        <div className="flex items-center gap-3 mb-5">
          <Badge label={ph.phase} color={ph.badgeColor} />
          <span className="text-sm text-slate-500">{ph.period}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ph.milestones.map(m => (
            <div key={m.month} className="bg-white rounded-lg border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge label={m.month} color="bg-slate-100 text-slate-600" />
                <span className="font-semibold text-slate-800 text-sm">{m.title}</span>
              </div>
              <ul className="space-y-1">
                {m.items.map(item => <Check key={item} text={item} />)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SectionFinance = () => (
  <div className="space-y-6">
    <SectionTitle icon={BarChart2} title="재무 계획" subtitle="3개년 수익 예측 및 투자 계획" />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { year: 'Year 1', arr: '₩79,000,000', sub: '약 7,900만원', basic: 80, pro: 10, ent: 0, color: 'from-slate-600 to-slate-800' },
        { year: 'Year 2', arr: '₩476,000,000', sub: '약 4억 8천만원', basic: 400, pro: 120, ent: 5, color: 'from-blue-600 to-blue-800' },
        { year: 'Year 3', arr: '₩1,826,000,000', sub: '약 18억 3천만원', basic: 1200, pro: 600, ent: 30, color: 'from-indigo-600 to-purple-700' },
      ].map(y => (
        <div key={y.year} className={`rounded-xl bg-gradient-to-br ${y.color} text-white p-5`}>
          <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{y.year}</div>
          <div className="text-2xl font-bold">{y.arr}</div>
          <div className="text-sm opacity-70 mb-4">{y.sub} ARR</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="opacity-60">Basic 구독</span><span className="font-semibold">{y.basic}개 학원</span></div>
            <div className="flex justify-between"><span className="opacity-60">Pro 구독</span><span className="font-semibold">{y.pro}개 학원</span></div>
            <div className="flex justify-between"><span className="opacity-60">Enterprise</span><span className="font-semibold">{y.ent}개 학원</span></div>
          </div>
        </div>
      ))}
    </div>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">초기 투자 계획 (12개월)</h3>
      <div className="space-y-3">
        {[
          { cat: '개발 인건비', items: [['백엔드 개발자 2명', '₩100,000,000'], ['프론트엔드 개발자 1명', '₩55,000,000'], ['모바일 개발자 1명', '₩55,000,000'], ['UX/UI 디자이너 1명', '₩45,000,000']], total: '₩255,000,000', color: 'bg-blue-50' },
          { cat: '인프라 & 운영', items: [['AWS 인프라', '₩12,000,000'], ['외부 API (SMS·알림톡)', '₩6,000,000'], ['PG사 셋업 + 기타', '₩3,000,000']], total: '₩21,000,000', color: 'bg-emerald-50' },
          { cat: '마케팅', items: [['디지털 광고 (네이버·구글)', '₩24,000,000'], ['콘텐츠 제작', '₩12,000,000'], ['이벤트·박람회', '₩5,000,000']], total: '₩41,000,000', color: 'bg-amber-50' },
        ].map(c => (
          <div key={c.cat} className={`rounded-lg ${c.color} p-4`}>
            <div className="font-semibold text-slate-800 mb-2">{c.cat}</div>
            <div className="space-y-1">
              {c.items.map(([label, amount]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-700">{amount}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-white/60 font-bold text-sm">
              <span>소계</span><span>{c.total}</span>
            </div>
          </div>
        ))}
        <div className="flex justify-between font-bold text-lg p-4 rounded-lg bg-slate-900 text-white">
          <span>총 12개월 소요 예산</span>
          <span>₩317,000,000</span>
        </div>
      </div>
    </Card>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-3">손익 분기점 (BEP)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs text-slate-400 mb-1">월 고정 비용</div>
          <div className="text-xl font-bold text-slate-800">₩30,000,000</div>
          <div className="text-xs text-slate-400">인건비 + 인프라 + 마케팅</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="text-xs text-slate-400 mb-1">BEP 도달 조건</div>
          <div className="text-xl font-bold text-blue-700">약 612개</div>
          <div className="text-xs text-slate-400">유료 학원 구독 시점</div>
        </div>
        <div className="rounded-lg bg-emerald-50 p-4">
          <div className="text-xs text-slate-400 mb-1">예상 BEP 도달</div>
          <div className="text-xl font-bold text-emerald-700">약 18개월</div>
          <div className="text-xs text-slate-400">Year 2 중반</div>
        </div>
      </div>
    </Card>
  </div>
);

const SectionRisk = () => (
  <div className="space-y-6">
    <SectionTitle icon={AlertTriangle} title="리스크 관리" subtitle="주요 리스크 식별 및 대응 전략" />

    <div className="space-y-4">
      {[
        {
          title: '경쟁사 대응 (통통통의 빠른 추격)',
          level: '중',
          levelColor: 'bg-amber-100 text-amber-700',
          risks: ['통통통이 가격 공개 + 체육 특화 기능 추가할 경우'],
          mitigations: ['종목별 깊이 있는 기능으로 차별화 유지', '강사 앱 UX에서 압도적 우위 확보', '커뮤니티(학원 원장 네트워크) 선점'],
        },
        {
          title: '낮은 전환율 (Free → 유료)',
          level: '중',
          levelColor: 'bg-amber-100 text-amber-700',
          risks: ['무료 플랜 남용', '유료 전환 유인 부족'],
          mitigations: ['원생 30명 한도를 강력한 업그레이드 트리거로', '"한도 도달 5명 전"부터 점진적 업그레이드 안내', '보강 자동화 등 핵심 편의 기능은 Basic에만'],
        },
        {
          title: '개인정보 보안 사고',
          level: '고',
          levelColor: 'bg-red-100 text-red-700',
          risks: ['아동 포함 원생 정보 유출 시 사업 치명타'],
          mitigations: ['PIPA(개인정보보호법) 완전 준수', 'TLS 1.3 + AES-256 암호화', '정기 보안 컨설팅', '정보보안 책임보험 가입'],
        },
        {
          title: '결제 시스템 안정성',
          level: '중',
          levelColor: 'bg-amber-100 text-amber-700',
          risks: ['PG 장애 시 수강료 결제 불가 → 학원 운영 차질'],
          mitigations: ['복수 PG사 연동 (토스페이먼츠 + NICE페이먼츠)', '장애 시 수동 수납 기록 모드 유지', 'SLA 99.9% 업타임 목표'],
        },
        {
          title: '보강 시 차량(셔틀) 이용 희망 케이스',
          level: '저',
          levelColor: 'bg-emerald-100 text-emerald-700',
          risks: ['보강은 원칙상 차량 미운행(보호자 직접 등하원)인데, 학부모가 셔틀 이용을 원하는 경우 정책 예외 처리 필요'],
          mitigations: ['기본 정책은 유지 (임의 경로 추가는 비효율적)', '보강 신청 시 "차량 이용 희망" 선택지 추가 → 기존 노선이 그 시간대에 이미 지나가는 경우에만 관리자가 해당 날짜 1회성으로 배정', '자동 경로 매칭(지리적 인접도 계산)은 추후 단계 — 지금은 관리자 수동 판단으로 처리'],
        },
        {
          title: '종목별 전문성 부족',
          level: '저',
          levelColor: 'bg-emerald-100 text-emerald-700',
          risks: ['종목 운영 특성을 제대로 반영 못 할 경우 이탈'],
          mitigations: ['종목별 자문단 구성 (현직 학원 원장)', '파일럿 학원 깊은 인터뷰 기반 기능 설계', '종목별 커뮤니티 베타 테스터 확보'],
        },
      ].map(r => (
        <Card key={r.title}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-slate-800">{r.title}</h3>
            <Badge label={`위험도: ${r.level}`} color={r.levelColor} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">리스크</p>
              <ul className="space-y-1">
                {r.risks.map(ri => <Cross key={ri} text={ri} />)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">대응 전략</p>
              <ul className="space-y-1">
                {r.mitigations.map(m => <Check key={m} text={m} />)}
              </ul>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const SectionTeam = () => (
  <div className="space-y-6">
    <SectionTitle icon={Users} title="팀 구성 계획" subtitle="창업 핵심팀 → Series A 확장팀" />

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">창업 핵심팀 (Phase 1)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { role: 'CTO / 풀스택 리드', desc: '기술 아키텍처 + 백엔드 주도', icon: Code2, color: 'bg-purple-50 border-purple-200' },
          { role: 'Frontend 개발자', desc: 'React 웹 앱 (SwimSync 기반)', icon: LayoutGrid, color: 'bg-blue-50 border-blue-200' },
          { role: 'Mobile 개발자', desc: 'React Native 강사/학부모 앱', icon: Smartphone, color: 'bg-cyan-50 border-cyan-200' },
          { role: 'UX/UI 디자이너', desc: 'Figma 기반 디자인 시스템 구축', icon: Star, color: 'bg-pink-50 border-pink-200' },
          { role: 'CEO / 사업 개발', desc: '영업, 파트너십, 투자 유치', icon: TrendingUp, color: 'bg-amber-50 border-amber-200' },
        ].map(m => (
          <div key={m.role} className={`rounded-lg border ${m.color} p-4`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${m.color}`}>
              <m.icon size={16} className="text-slate-600" />
            </div>
            <div className="font-semibold text-slate-800 text-sm">{m.role}</div>
            <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
          </div>
        ))}
      </div>
    </Card>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">확장팀 (Phase 2~3, Series A 이후)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { role: '백엔드 개발자 +2', desc: 'API 확장, AI 연동' },
          { role: '마케팅 매니저', desc: '디지털 마케팅, 콘텐츠' },
          { role: '고객 성공 매니저 ×2', desc: '온보딩, 고객 지원' },
          { role: '데이터 분석가', desc: '이탈 예측, AI 모델' },
        ].map(m => (
          <div key={m.role} className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
            <div className="font-semibold text-slate-700 text-sm">{m.role}</div>
            <div className="text-xs text-slate-400 mt-1">{m.desc}</div>
          </div>
        ))}
      </div>
    </Card>

    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">투자 유치 전략</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            round: 'Seed Round',
            timing: '즉시 ~ 6개월',
            amount: '₩300M ~ ₩500M',
            use: ['MVP 개발', '파일럿 운영', '초기 팀 구성'],
            target: '개인 투자자 (Angel), 초기 VC, 소상공인 지원 프로그램',
            color: 'border-blue-200 bg-blue-50',
          },
          {
            round: 'Series A',
            timing: '12 ~ 18개월',
            amount: '₩2B ~ ₩5B',
            use: ['팀 확장', '마케팅 가속', 'Enterprise 기능 개발'],
            target: 'ARR ₩500M 이상, 유료 학원 500개 이상 달성 후',
            color: 'border-indigo-200 bg-indigo-50',
          },
        ].map(inv => (
          <div key={inv.round} className={`rounded-xl border-2 ${inv.color} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800">{inv.round}</span>
              <span className="text-xs text-slate-400">{inv.timing}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-3">{inv.amount}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">용도</div>
            <ul className="space-y-1 mb-3">
              {inv.use.map(u => <Check key={u} text={u} />)}
            </ul>
            <div className="text-xs text-slate-500 bg-white/60 rounded p-2">{inv.target}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 섹션 렌더러 맵
// ─────────────────────────────────────────────────────────────
const SECTION_COMPONENTS: Record<string, React.FC> = {
  summary:  SectionSummary,
  analysis: SectionAnalysis,
  market:   SectionMarket,
  product:  SectionProduct,
  spec:     SectionSpec,
  tech:     SectionTech,
  revenue:  SectionRevenue,
  gtm:      SectionGTM,
  roadmap:  SectionRoadmap,
  finance:  SectionFinance,
  risk:     SectionRisk,
  team:     SectionTeam,
};

// ─────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function BusinessPlan() {
  const [activeSection, setActiveSection] = useState('summary');
  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className="flex h-full bg-slate-50">
      {/* 좌측 섹션 네비게이션 */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
        <div className="p-4 border-b border-slate-100">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">ClassSync</div>
          <div className="text-sm font-semibold text-slate-800 mt-0.5">사업 기획서 v1.1</div>
          <div className="text-xs text-slate-400 mt-0.5">2026년 8월 업데이트 — 현재 구현 현황 반영</div>
        </div>
        <nav className="p-2">
          {SECTIONS.map((sec, idx) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 text-left ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="leading-tight">{sec.label}</span>
                {isActive && <ChevronRight size={13} className="ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {ActiveComponent && <ActiveComponent />}

          {/* 하단 네비게이션 */}
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-200">
            {(() => {
              const currentIdx = SECTIONS.findIndex(s => s.id === activeSection);
              const prev = SECTIONS[currentIdx - 1];
              const next = SECTIONS[currentIdx + 1];
              return (
                <>
                  {prev ? (
                    <button onClick={() => setActiveSection(prev.id)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors">
                      <ChevronRight size={16} className="rotate-180" />
                      <span>{prev.label}</span>
                    </button>
                  ) : <div />}
                  {next ? (
                    <button onClick={() => setActiveSection(next.id)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors">
                      <span>{next.label}</span>
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                      <CheckCircle size={16} />
                      <span>기획서 완독 완료</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
