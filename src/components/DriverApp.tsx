import { useState } from 'react';
import { useStore, getPrimaryContactPhone } from '../store/StoreContext';
import { format, isAfter, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Car, MapPin, Users, Clock, Info, ChevronRight, Navigation, Phone } from 'lucide-react';

export default function DriverApp() {
  const { drivers, vehicles, students, classes } = useStore();
  const [activeTab, setActiveTab] = useState<'route' | 'students'>('route');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Mock: logged in as driver d1
  const driverId = 'd1';
  const driver = drivers.find(d => d.id === driverId);
  const vehicle = vehicles.find(v => v.driverId === driverId);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDisplay = format(new Date(), 'M월 d일 (E)', { locale: ko });

  // Students assigned to this vehicle
  const assignedStudents = vehicle ? students.filter(s => vehicle.studentIds.includes(s.id)) : [];

  // Today's class sessions for assigned students
  const todayClasses = classes.filter(c => c.date === today);

  // 보강 수업은 차량이 운행되지 않으므로(정규 수업만 픽업 대상), 정규 수강(studentIds)으로만 오늘 탑승자를 계산
  const allTodayStudents = assignedStudents.filter(s => {
    const hasRegularClass = todayClasses.some(c => c.studentIds.includes(s.id));
    const isAbsent = todayClasses.some(c => c.absentStudentIds.includes(s.id));
    return hasRegularClass && !isAbsent;
  });

  // 오늘 보강으로 결석 처리된(=정규 픽업 대상에서 빠진) 우리 차량 학생 — 참고용 안내
  const makeupAbsentTodayCount = assignedStudents.filter(s =>
    todayClasses.some(c => c.studentIds.includes(s.id) && c.absentStudentIds.includes(s.id))
  ).length;

  return (
    <div className="flex items-center justify-center h-full bg-slate-100 p-8">
      {/* Phone mockup */}
      <div className="w-[390px] h-[844px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden relative flex flex-col">

        {/* Status bar */}
        <div className="h-12 bg-white flex items-center justify-between px-6 text-xs font-semibold text-slate-800 shrink-0">
          <span>{format(new Date(), 'HH:mm')}</span>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800" />
        </div>

        {/* Header */}
        <div className="shrink-0" style={{ background: 'linear-gradient(135deg, #0891b2, #3b82f6)' }}>
          <div className="px-6 pt-4 pb-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-white/80 text-xs font-medium">기사 앱</p>
                <div className="flex items-center gap-2">
                  <h1 className="text-white text-xl font-bold">{driver?.name ?? '기사'} 님</h1>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
            </div>
            {vehicle && (
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">{vehicle.vehicleNumber}</span>
                <span className="text-white/80 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {vehicle.route}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex px-4 pb-0">
            {(['route', 'students'] as const).map((id) => {
            const label = id === 'route' ? '오늘 노선' : '전체 탑승생';
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors rounded-t-xl ${activeTab === id ? 'bg-white text-cyan-700' : 'text-white/70 hover:text-white'}`}>
                {label}
              </button>
            );
          })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 pb-20">

          {activeTab === 'route' && (
            <div className="px-4 py-4 space-y-3">
              {/* Date + vehicle info */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs">오늘 운행일</p>
                  <p className="text-slate-800 font-bold text-base mt-0.5">{todayDisplay}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs">출발 시간</p>
                  <p className="text-slate-800 font-bold text-base mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                    {vehicle?.departureTime ?? '--:--'}
                  </p>
                </div>
              </div>

              {/* ── 보강 안내 (차량 미운행 정책) ── */}
              {makeupAbsentTodayCount > 0 && (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-slate-500 text-xs">
                    오늘 원래 탑승 예정이던 학생 중 <strong className="text-slate-700">{makeupAbsentTodayCount}명</strong>이 보강으로 결석 처리되어 픽업 목록에서 빠졌어요.
                    <strong className="text-slate-700"> 보강 수업은 차량이 운행되지 않아요</strong> — 보호자가 직접 등하원해요.
                  </p>
                </div>
              )}

              {/* ── Regular pickup list ── */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-cyan-600" />
                    <span className="text-slate-700 text-sm font-semibold">픽업 순서</span>
                  </div>
                  <span className="text-slate-400 text-xs">{allTodayStudents.length}명</span>
                </div>
                {allTodayStudents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    오늘 탑승 예정 학생이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {allTodayStudents.map((s, idx) => {
                      const isExpanded = expandedStudentId === s.id;
                      return (
                        <div key={s.id}>
                          <button onClick={() => setExpandedStudentId(isExpanded ? null : s.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                              {idx + 1}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {s.studentName[0]}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-slate-800 text-sm font-medium">{s.studentName}</p>
                              <p className="text-slate-400 text-xs truncate">{s.address || '주소 없음'}</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-3 -mt-1 animate-fade-up">
                              <a href={`tel:${getPrimaryContactPhone(s)}`} className="flex items-center gap-2 bg-cyan-50 border border-cyan-100 rounded-xl px-3 py-2.5 text-cyan-700 text-sm font-semibold">
                                <Phone className="w-3.5 h-3.5" /> {getPrimaryContactPhone(s) || '연락처 없음'} (탭하여 전화)
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="px-4 py-4 space-y-3">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span className="text-slate-700 text-sm font-semibold">전체 탑승생</span>
                  </div>
                  <span className="text-slate-400 text-xs">{assignedStudents.length}명</span>
                </div>
                {assignedStudents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">배정된 학생이 없습니다.</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {assignedStudents.map(s => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {s.studentName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-sm font-semibold">{s.studentName}</p>
                          <p className="text-slate-400 text-xs truncate">{s.address || '주소 없음'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-slate-600 text-xs">{s.regularDays.join('·')}</p>
                          <p className="text-slate-400 text-xs">{s.regularTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Driver contact card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-slate-500 text-xs font-medium mb-2">내 정보</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800 text-sm font-semibold">{driver?.name}</p>
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {driver?.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-xs">{vehicle?.vehicleNumber}</p>
                    <p className="text-cyan-600 text-xs font-medium">{vehicle?.route}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-0 w-full h-20 bg-white border-t border-slate-100 flex justify-around items-center px-6 pb-4 rounded-b-[2.5rem] z-10">
          <button onClick={() => setActiveTab('route')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'route' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <Navigation className="w-6 h-6" />
            <span className="text-[10px] font-medium">오늘 노선</span>
          </button>
          <button onClick={() => setActiveTab('students')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'students' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium">탑승생</span>
          </button>
        </div>
      </div>
    </div>
  );
}
