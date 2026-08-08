/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Users, Smartphone, UserCircle, LogOut,
  FileText, Waves, Bell, Car, CreditCard, Truck, Sparkles,
  RefreshCw, IdCard, HelpCircle, MessageSquareText, CalendarClock
} from 'lucide-react';
import AdminSchedule from './components/AdminSchedule';
import AdminStudents from './components/AdminStudents';
import AdminNotifications from './components/AdminNotifications';
import AdminVehicles from './components/AdminVehicles';
import AdminPayments from './components/AdminPayments';
import AdminMakeups from './components/AdminMakeups';
import AdminStaff from './components/AdminStaff';
import AdminCounseling from './components/AdminCounseling';
import AdminScheduleChanges from './components/AdminScheduleChanges';
import InstructorApp from './components/InstructorApp';
import ParentApp from './components/ParentApp';
import DriverApp from './components/DriverApp';
import BusinessPlan from './components/BusinessPlan';
import { InteractiveTooltip, OnboardingCarousel, PageGuidePanel } from './components/GuideSystem';
import type { PageGuideFeature } from './components/GuideSystem';
import { StoreProvider, useStore } from './store/StoreContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import AuthScreen from './components/AuthScreen';
import OrgSwitcher from './components/OrgSwitcher';
import { Loader2 } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabaseClient';

const navGroups = [
  {
    label: '관리자 도구',
    items: [
      { id: 'schedule',      icon: LayoutDashboard, text: '스케줄 관리' },
      { id: 'students',      icon: Users,            text: '강습생 관리' },
      { id: 'staff',         icon: IdCard,           text: '직원 관리' },
      { id: 'counseling',    icon: MessageSquareText, text: '상담 관리' },
      { id: 'payments',      icon: CreditCard,       text: '결제 관리' },
      { id: 'makeups',       icon: RefreshCw,        text: '보강 요청 관리' },
      { id: 'schedule-changes', icon: CalendarClock, text: '일정 변경 요청' },
      { id: 'notifications', icon: Bell,             text: '공지 발송' },
      { id: 'vehicles',      icon: Car,              text: '차량 관리' },
    ],
  },
  {
    label: '앱 미리보기',
    items: [
      { id: 'instructor-app', icon: Smartphone,  text: '강사 앱' },
      { id: 'parent-app',     icon: UserCircle,  text: '학부모 앱' },
      { id: 'driver-app',     icon: Truck,       text: '기사 앱' },
    ],
  },
  {
    label: '기획',
    items: [
      { id: 'business-plan', icon: FileText, text: '사업 기획서' },
    ],
  },
] as const;

type TabId =
  | 'schedule' | 'students' | 'staff' | 'counseling' | 'payments' | 'makeups' | 'schedule-changes' | 'notifications' | 'vehicles'
  | 'instructor-app' | 'parent-app' | 'driver-app'
  | 'business-plan';

const PAGE_GUIDES: Record<TabId, { title: string; description: string; features: PageGuideFeature[] }> = {
  schedule: {
    title: '스케줄 관리',
    description: '전체 강습 스케줄과 수영장 일정을 한눈에 확인하고 관리하는 화면이에요.',
    features: [
      { label: '주간/월간 보기', description: '상단에서 보기 단위를 바꿔 이번 주 또는 이번 달 일정을 확인해요.' },
      { label: '강사 필터', description: '특정 강사의 수업만 골라서 볼 수 있어요.' },
      { label: '일정 추가', description: '특강·휴강·메모 등 스케줄 외 일정을 등록해요.' },
      { label: '수업 칸 클릭', description: '해당 시간대에 배정된 학생 목록, 정원(N/N명), 출결(정규/보강/결석) 상태, 차량 등하원 정보를 확인해요.' },
      { label: '보강 취소', description: '정원이 다 찼는데 신규·체험 문의가 그 시간대에 들어온 경우, 보강 학생 줄의 "보강 취소" 버튼으로 자리를 비울 수 있어요. 취소하면 학부모 앱·강사 앱에 벨소리와 함께 알림이 가고, 학부모는 보강을 다시 신청해야 해요.' },
      { label: '설정(톱니바퀴)', description: '학원명·지점명, 지정 강습 시간대를 변경해요. 강사 등록·수정은 "직원 관리"에서 해요.' },
    ],
  },
  students: {
    title: '강습생 관리',
    description: '학생 등록, 반 배정, 수강 정보, 수납 내역까지 학생과 관련된 모든 데이터를 관리해요.',
    features: [
      { label: '강습반별 보기 / 전체 목록', description: '반으로 묶어서 보거나 전체 학생을 리스트로 볼 수 있어요.' },
      { label: '검색', description: '이름·학생번호·전화번호로 바로 찾을 수 있어요.' },
      { label: '강습반 관리', description: '반 이름, 최대 정원 같은 반 자체 설정을 바꿔요.' },
      { label: '일괄 등록', description: '엑셀/CSV 파일로 여러 학생을 한 번에 등록해요.' },
      { label: '강습생 등록', description: '신규 학생을 등록해요 — 원생/모/부 연락처와 SMS 수신 대상도 각각 지정해요.' },
      { label: '반 등록정보', description: '학생 상세에서 다니는 반을 여러 개 등록·수정할 수 있어요. 담당 쌤·요일·시간을 바꿀 수 있고, 휴학·종강·등록취소도 여기서 해요.' },
      { label: '수납 내역', description: '반별로 이번 달 청구, 결제 여부, 결제 수단을 확인해요. "이번 달 청구 생성"으로 자동 청구서를 만들고, "수납 처리"로 입금을 기록해요.' },
    ],
  },
  staff: {
    title: '직원 관리',
    description: '강사와 직원의 인사 정보를 등록하고 관리하는 화면이에요.',
    features: [
      { label: '재직/퇴직/전체 필터', description: '근무 상태별로 직원 목록을 걸러볼 수 있어요.' },
      { label: '신규 직원 입력', description: '새 직원(강사 또는 일반 직원)을 등록해요.' },
      { label: '직원 상세 폼', description: '연락처, 입사일, 직책, 부서, 근무 요일·시간 등을 수정하고 저장해요.' },
      { label: '업무구분 = 강사', description: '업무구분을 "강사"로 선택하면 스케줄 색상, 1타임 정원 같은 강사 전용 항목이 추가로 나타나요.' },
      { label: '삭제', description: '더 이상 소속되지 않은 직원을 목록에서 제거해요.' },
    ],
  },
  counseling: {
    title: '상담 관리',
    description: '강사별 담당 강습생의 정기 상담 현황과 상담 일지를 확인·관리하는 화면이에요. 강사 앱에서 강사가 작성한 상담 기록이 여기에 그대로 연동돼요.',
    features: [
      { label: '정기 상담 주기 설정', description: '1개월/2개월/3개월 중 골라서 우리 학원의 정기 상담 주기를 정해요. 이 설정에 따라 "다음 상담 예정일"이 자동 계산돼요.' },
      { label: '상담 필요만 보기', description: '주기가 지났는데 아직 상담을 안 한 학생만 걸러서 볼 수 있어요.' },
      { label: '월별 보기', description: '상단 화살표로 달을 넘기면서 그 달에 진행된 상담만 모아 볼 수 있어요. "상담 필요/완료" 상태는 항상 오늘 날짜 기준으로 최신 상태를 보여줘요.' },
      { label: '강사별 그룹', description: '강사마다 담당 강습생 목록과 각자의 최근 상담일·다음 예정일·상태(상담 완료/상담 필요)를 보여줘요.' },
      { label: '펼쳐서 이력 보기', description: '학생을 누르면 지금까지의 상담 기록(일자+내용)이 전부 펼쳐져요.' },
      { label: '상담 기록 추가', description: '관리자도 직접 상담 기록을 추가할 수 있어요 (강사 앱에서 강사가 작성한 기록과 동일하게 저장돼요).' },
    ],
  },
  payments: {
    title: '결제 관리',
    description: '수강 플랜(요금제)을 설계하고, 전체 결제 현황과 보강 정책을 관리하는 화면이에요.',
    features: [
      { label: '요약 카드', description: '이번 달 수납액, 미수납액, 수강 중 총원을 한눈에 보여줘요.' },
      { label: '수강 플랜 탭', description: '아동/성인, 주 횟수, 자유수영 포함 여부에 따라 요금제를 추가·수정·삭제해요.' },
      { label: '결제 현황 탭', description: '학생별로 이번 달 결제가 완료됐는지 확인해요.' },
      { label: '보강 가능 횟수 정책', description: '주 몇 회 수강 시 보강을 몇 회까지 허용할지 규칙을 만들고, 아동/성인 보강 시 서류(진단서 등) 필요 여부를 설정해요.' },
    ],
  },
  makeups: {
    title: '보강 요청 관리',
    description: '학부모 앱에서 들어온 보강·이월 요청을 검토하고 승인하는 화면이에요.',
    features: [
      { label: '승인 대기 / 처리 완료 탭', description: '아직 처리 안 한 요청과 이미 처리한 요청을 나눠서 봐요.' },
      { label: '서류 사진 확인', description: '요청 카드의 썸네일을 눌러 학부모가 제출한 서류(진단서 등) 원본을 확인해요.' },
      { label: '보강 배정', description: '같은 구분(유치부/정규반/성인반)의 빈자리 중에서 골라 보강 일정을 확정해요.' },
      { label: '이월 처리', description: '보강 대신 다음 달 결제 금액에서 차감하는 방식으로 처리해요.' },
      { label: '거절', description: '요청을 승인하지 않고 반려해요.' },
    ],
  },
  'schedule-changes': {
    title: '일정 변경 요청 관리',
    description: '학부모 앱에서 신청한 요일·시간·수강 횟수 변경 요청을 검토하고 승인하는 화면이에요. 승인하면 그 학생의 반 등록정보가 실제로 바뀌어요.',
    features: [
      { label: '재등록 기간 설정', description: '매월 며칠부터 며칠까지를 "재등록 기간"으로 할지 학원마다 다르게 설정해요. 주 1회→주 2회처럼 수강 횟수가 바뀌는 요청은 이 기간에만 학부모가 신청할 수 있어요 (같은 횟수에서 요일·시간만 바꾸는 건 언제든 신청 가능해요).' },
      { label: '승인 대기 / 처리 완료 탭', description: '아직 처리 안 한 요청과 처리된 요청을 나눠서 봐요.' },
      { label: '변경 전 → 변경 후 비교', description: '카드에서 요청 전/후 요일·시간·수강권을 한눈에 비교해요.' },
      { label: '승인', description: '누르면 그 학생의 반 등록정보(요일/시간/수강권)에 바로 반영돼요.' },
      { label: '거절', description: '요청을 반려해요. 반영되지 않아요.' },
    ],
  },
  notifications: {
    title: '공지 발송',
    description: '학부모에게 SMS/앱 푸시 공지를 작성하고 발송하는 화면이에요.',
    features: [
      { label: '공지 유형 선택', description: '공지 성격에 맞는 템플릿을 골라 제목·내용을 빠르게 채워요.' },
      { label: '수신 대상 선택', description: '체크박스로 학생을 골라 선택하거나 "전체 선택/해제"로 한 번에 관리해요. 실제 발송은 모/부 등 지정된 SMS 수신자에게 가요.' },
      { label: '임시 저장', description: '아직 보내지 않고 초안으로만 남겨둬요.' },
      { label: '발송', description: '선택한 대상에게 바로 공지를 전송해요.' },
      { label: '발송 내역', description: '전체/발송 완료/임시 저장별로 지난 공지들을 다시 볼 수 있어요.' },
    ],
  },
  vehicles: {
    title: '차량 관리',
    description: '통학 차량, 기사, 탑승 학생과 일별 노선을 관리하는 화면이에요.',
    features: [
      { label: '기사 관리 탭', description: '기사를 추가·수정·삭제해요.' },
      { label: '차량 노선 관리 탭', description: '차량을 추가하고, 각 차량에 탑승할 학생을 배정해요.' },
      { label: '일별 노선 관리 탭', description: '요일별 실제 등하원 대상을 보여줘요. 다중 반에 등록된 학생도 해당 요일의 반 기준으로 정확히 반영돼요.' },
      { label: '노선별 / 시간별 보기', description: '같은 목록을 노선 기준으로 묶어보거나, 출발 시간 기준으로 묶어서 볼 수 있어요.' },
    ],
  },
  'instructor-app': {
    title: '강사 앱 (미리보기)',
    description: '강사가 실제로 보게 될 모바일 화면을 관리자 화면에서 미리 확인할 수 있어요.',
    features: [
      { label: '오늘 일정 탭', description: '주간 날짜 스트립에서 날짜를 골라 그날 맡은 수업과 참석/결석 학생을 확인해요.' },
      { label: '내 강습생 탭', description: '자신이 맡은 모든 학생 목록을 봐요 (다중 반으로 추가 배정된 학생도 포함돼요).' },
      { label: '보강·이월 요청 탭', description: '자기 학생의 보강 신청 현황을 확인해요.' },
      { label: '진도 및 특이사항 기록하기', description: '학생별로 오늘 배운 내용이나 특이사항을 기록해요. 학부모 앱 "나의 진도"에 바로 반영돼요.' },
      { label: '새로 배정된 보강 학생 알림', description: '보강으로 새로 내 수업에 들어온 학생이 있으면 상단에 알려줘요.' },
      { label: '보강 취소 알림', description: '학원이 자리 사정(신규·체험 문의 등)으로 내가 맡을 보강을 취소하면, 오늘 일정 탭 상단에 벨소리와 함께 알림이 떠요.' },
      { label: '메시지 탭', description: '학생(학부모)별 채팅 목록이에요. 눌러서 1:1로 메시지를 주고받고, 전화 버튼으로 실제 통화도 걸 수 있어요. 통화 후에는 "통화 메모"를 남겨 대화창에 기록할 수 있어요.' },
    ],
  },
  'parent-app': {
    title: '학부모 앱 (미리보기)',
    description: '학부모가 실제로 보게 될 모바일 화면을 미리 확인할 수 있어요.',
    features: [
      { label: '홈 탭', description: '다음 강습 일정, 이번 달 출석 현황, 나의 진도(강사 기록)를 확인해요.' },
      { label: '내 수업 정보', description: '지금 다니는 반의 요일·시간·수강권을 보여줘요. "변경 신청"을 누르면 학원에 요청을 보내고, 학원이 확인 후 승인하면 실제로 반영돼요. 같은 주당 횟수 내 요일·시간 변경은 언제든 가능하지만, 주 1회→주 2회처럼 횟수 자체를 바꾸는 신청은 학원이 정한 재등록 기간에만 할 수 있어요.' },
      { label: '보강 취소 알림', description: '잡아둔 보강이 학원 사정(신규·체험 문의 등)으로 취소되면 홈 화면 상단에 벨소리와 함께 알림이 뜨고, "보강 다시 신청하기" 버튼으로 바로 재신청 화면으로 이동할 수 있어요.' },
      { label: '결제 현황', description: '미결제 항목을 모아 보여주고, "결제하기" 버튼으로 카드/카카오페이/네이버페이 중 골라 결제해요 (현재는 시뮬레이션이에요).' },
      { label: '결석 탭', description: '달력에서 날짜를 골라 결석을 신청해요.' },
      { label: '보강 신청 탭', description: '결석일 → 보강 희망일 → 시간 순서로 골라 신청해요. 같은 구분(유치부/정규반/성인반)의 자리만 보여줘요.' },
      { label: '메시지 탭', description: '담당 강사와 1:1로 채팅해요. 전화 버튼으로 실제 통화도 걸 수 있고, 통화 후 "통화 메모"를 남기면 대화창에 함께 기록돼요.' },
    ],
  },
  'driver-app': {
    title: '기사 앱 (미리보기)',
    description: '통학 차량 기사가 실제로 보게 될 모바일 화면을 미리 확인할 수 있어요.',
    features: [
      { label: '오늘 노선 탭', description: '오늘 픽업 순서대로 학생 목록을 보여줘요. 학생을 누르면 펼쳐지고, 전화번호를 탭하면 바로 전화를 걸어요.' },
      { label: '전체 탑승생 탭', description: '이 차량에 배정된 모든 학생과 요일·시간을 확인해요.' },
      { label: '보강 결석 자동 제외', description: '보강으로 결석 처리된 학생은 오늘 픽업 목록에서 자동으로 빠져요 (보강 수업은 차량이 운행되지 않고 보호자가 직접 등하원해요).' },
    ],
  },
  'business-plan': {
    title: '사업 기획서',
    description: 'SwimSync의 시장 분석부터 기술 전략, 재무 계획까지 정리한 읽기 전용 기획 문서예요.',
    features: [
      { label: '섹션 탭', description: 'Executive Summary, 현황 분석, 시장 분석, 제품 정의, 기술 아키텍처, 수익 모델, GTM 전략, 개발 로드맵, 재무 계획, 리스크 관리, 팀 구성 순으로 넘겨볼 수 있어요.' },
    ],
  },
};

function AppContent() {
  const { signOut } = useAuth();
  const [active, setActive] = useState<TabId>('schedule');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [guideOpenTab, setGuideOpenTab] = useState<TabId | null>(null);
  const scheduleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const seen = window.localStorage.getItem('swimsync-onboarding-seen');
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (active === 'schedule') return; // 최초 진입 화면은 온보딩 가이드가 이미 설명해줘요.
    const seenKey = `swimsync-page-guide-seen-${active}`;
    if (!window.localStorage.getItem(seenKey)) {
      setGuideOpenTab(active);
      window.localStorage.setItem(seenKey, 'true');
    }
  }, [active]);

  const finishOnboarding = () => {
    window.localStorage.setItem('swimsync-onboarding-seen', 'true');
    setShowOnboarding(false);
    setShowTooltip(true);
  };

  const skipOnboarding = () => {
    window.localStorage.setItem('swimsync-onboarding-seen', 'true');
    setShowOnboarding(false);
    setShowTooltip(false);
  };

  const onboardingSteps = [
    {
      title: '운영 흐름을 한 번에 살펴보세요',
      description: '스케줄, 강습생, 결제, 공지와 차량까지 관리자 도구에서 연계 관리할 수 있습니다.',
      bullets: ['스케줄 관리로 수업 일정을 확인', '강습생 관리로 등록·수정·상태 변경', '결제와 공지를 통해 운영 흐름을 정리']
    },
    {
      title: '사용자 앱 경험을 바로 확인해요',
      description: '강사·학부모·기사 앱이 실제로 어떻게 보일지 미리 확인해볼 수 있습니다.',
      bullets: ['강사 앱: 오늘 수업과 학생 상태 확인', '학부모 앱: 보강·결석 신청 지원', '기사 앱: 오늘 노선과 탑승 학생 안내']
    },
    {
      title: '서비스 방향과 전략도 함께 확인해요',
      description: '사업 기획서 탭에서 시장, 제품, 기술 전략까지 한눈에 파악할 수 있습니다.',
      bullets: ['시장 분석과 차별화 포인트 확인', '기술 아키텍처와 개발 로드맵 확인', '서비스 확장 방향을 함께 살펴보기']
    },
    {
      title: '처음엔 스케줄 관리부터 시작해보세요',
      description: '가장 먼저 운영 흐름을 파악할 수 있는 스케줄 관리로 진입해보면 자연스럽게 전체 기능을 익힐 수 있습니다.',
      bullets: ['오늘·이번 주·이번 달 일정 확인', '특강·공지·메모를 즉시 등록', '다음 단계로 운영 루프를 이어가기']
    }
  ];

  const renderContent = () => {
    switch (active) {
      case 'schedule':       return <AdminSchedule />;
      case 'students':       return <AdminStudents />;
      case 'staff':          return <AdminStaff />;
      case 'counseling':     return <AdminCounseling />;
      case 'payments':       return <AdminPayments />;
      case 'makeups':        return <AdminMakeups />;
      case 'schedule-changes': return <AdminScheduleChanges />;
      case 'notifications':  return <AdminNotifications />;
      case 'vehicles':       return <AdminVehicles />;
      case 'instructor-app': return <InstructorApp />;
      case 'parent-app':     return <ParentApp />;
      case 'driver-app':     return <DriverApp />;
      case 'business-plan':  return <BusinessPlan />;
      default:               return <AdminSchedule />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col bg-white border-r border-slate-200">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg,#0891b2,#3b82f6)' }}
          >
            <Waves size={17} className="text-white" />
          </div>
          <div>
            <p className="text-slate-900 font-bold text-[15px] leading-none tracking-tight">SwimSync</p>
            <p className="text-slate-400 text-[10px] mt-1 leading-none">수영장 통합 관리</p>
          </div>
        </div>

        <div className="mx-5 mb-3 h-px bg-slate-100" />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-4 overflow-y-auto pb-4">
          {navGroups.map(({ label, items }) => (
            <div key={label}>
              <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ id, icon: Icon, text }) => {
                  const on = active === id;
                  return (
                    <button
                      key={id}
                      ref={id === 'schedule' ? scheduleButtonRef : undefined}
                      onClick={() => setActive(id as TabId)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        on
                          ? 'bg-cyan-50 text-cyan-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={15} className={`shrink-0 ${on ? 'text-cyan-600' : 'text-slate-400'}`} />
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 pt-3 border-t border-slate-100 space-y-2">
          <OrgSwitcher />
          <button
            onClick={() => { setShowOnboarding(true); setShowTooltip(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 transition-all duration-150"
          >
            <Sparkles size={14} className="shrink-0" />
            가이드 다시 보기
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-150"
          >
            <LogOut size={14} className="shrink-0" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto bg-slate-50 relative">
        {renderContent()}
      </main>

      <button
        onClick={() => setGuideOpenTab(active)}
        title="이 페이지 사용법 보기"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-slate-800"
      >
        <HelpCircle size={16} /> 이 페이지 사용법
      </button>

      <PageGuidePanel
        open={guideOpenTab === active}
        title={PAGE_GUIDES[active].title}
        description={PAGE_GUIDES[active].description}
        features={PAGE_GUIDES[active].features}
        onClose={() => setGuideOpenTab(null)}
      />

      <OnboardingCarousel
        open={showOnboarding}
        slides={onboardingSteps}
        onClose={skipOnboarding}
        onFinish={finishOnboarding}
      />

      <InteractiveTooltip
        open={showTooltip}
        targetRef={scheduleButtonRef}
        title="운영 관리부터 시작해보세요"
        description="왼쪽의 스케줄 관리 버튼을 눌러 오늘·이번 주 일정과 운영 흐름을 바로 확인해보세요."
        ctaLabel="스케줄 관리로 이동"
        onCta={() => {
          setActive('schedule');
          setShowTooltip(false);
        }}
        onClose={() => setShowTooltip(false)}
      />
    </div>
  );
}

function AuthGate() {
  const { loading, session, memberships } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  if (memberships.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 p-6">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-slate-800 font-bold mb-2">소속된 조직이 없어요</p>
          <p className="text-slate-500 text-sm leading-relaxed">
            기관에서 강사로 초대받으셨다면, 초대 알림이 곧 표시돼요. 그렇지 않다면 잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
