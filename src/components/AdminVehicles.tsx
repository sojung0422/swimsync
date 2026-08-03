import { useState } from 'react';
import { useStore, getAllEnrollments } from '../store/StoreContext';
import type { Driver, Vehicle, Student, Enrollment } from '../store/StoreContext';
import { Car, User, Plus, Edit2, Trash2, X, MapPin, Clock, Users, AlertCircle, ChevronDown, ChevronUp, CalendarDays, LogIn, LogOut } from 'lucide-react';
import { EmptyStateGuide } from './GuideSystem';

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const KOREAN_DAY_BY_JS_INDEX = ['일', '월', '화', '수', '목', '금', '토'];

// 다중 반(추가 등록 포함) 중 해당 요일에 수업이 있는 가장 이른 등록 정보 — 없으면 null (그 요일엔 등원 안 함)
const getEarliestEnrollmentForDay = (student: Student, day: string): Enrollment | null => {
  const matches = getAllEnrollments(student).filter(e => e.status === 'active' && e.regularDays.includes(day));
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => a.regularTime.localeCompare(b.regularTime))[0];
};

// ─── Driver Form Modal ────────────────────────────────────────────────────────

function DriverFormModal({ initial, onClose, onSave, title }: {
  initial?: Driver; onClose: () => void; onSave: (d: Omit<Driver, 'id'>) => void; title: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [vehicleNumber, setVehicleNumber] = useState(initial?.vehicleNumber ?? '');

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>기사명 *</label>
            <input className={inputCls} placeholder="홍기사" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>연락처</label>
            <input className={inputCls} placeholder="010-0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>차량 번호</label>
            <input className={inputCls} placeholder="서울 12가 3456" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
            <button onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), phone, vehicleNumber }); onClose(); }}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Form Modal ───────────────────────────────────────────────────────

function VehicleFormModal({ initial, onClose, onSave, title }: {
  initial?: Vehicle; onClose: () => void; onSave: (v: Omit<Vehicle, 'id' | 'studentIds'>) => void; title: string;
}) {
  const { drivers } = useStore();
  const [vehicleNumber, setVehicleNumber] = useState(initial?.vehicleNumber ?? '');
  const [driverId, setDriverId] = useState(initial?.driverId ?? '');
  const [route, setRoute] = useState(initial?.route ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity ?? 15);
  const [departureTime, setDepartureTime] = useState(initial?.departureTime ?? '14:30');

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>차량 번호 *</label>
              <input className={inputCls} placeholder="서울 12가 3456" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>담당 기사</label>
              <select className={`${inputCls} cursor-pointer`} value={driverId} onChange={e => setDriverId(e.target.value)}>
                <option value="">선택 (없음)</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>출발 시간</label>
              <input type="time" className={inputCls} value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>정원</label>
              <input type="number" className={inputCls} value={capacity} onChange={e => setCapacity(parseInt(e.target.value) || 0)} min={1} />
            </div>
          </div>
          <div>
            <label className={labelCls}>노선 정보</label>
            <input className={inputCls} placeholder="예: A노선 (강남→서초)" value={route} onChange={e => setRoute(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
            <button onClick={() => { if (!vehicleNumber.trim()) return; onSave({ vehicleNumber: vehicleNumber.trim(), driverId, route, capacity, departureTime }); onClose(); }}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Student Assignment Modal ─────────────────────────────────────────────────

function AssignStudentsModal({ vehicle: initialVehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const { students, vehicles, assignStudentToVehicle } = useStore();
  const vehicle = vehicles.find(v => v.id === initialVehicle.id) ?? initialVehicle;
  const eligibleStudents = students.filter(s => s.status === 'active');
  const isFull = vehicle.studentIds.length >= vehicle.capacity;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">탑승 학생 배정 — {vehicle.vehicleNumber}</h2>
            <p className={`text-xs mt-1 ${isFull ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>{vehicle.studentIds.length}/{vehicle.capacity}명 탑승 {isFull ? '(만석)' : ''}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {eligibleStudents.map(s => {
            const assigned = vehicle.studentIds.includes(s.id);
            const blocked = !assigned && isFull;
            return (
              <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {s.studentName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 text-sm font-medium">{s.studentName}</p>
                  <p className="text-slate-400 text-xs">{s.address || '주소 없음'}</p>
                </div>
                <button onClick={() => !blocked && assignStudentToVehicle(s.id, assigned ? '' : vehicle.id)}
                  disabled={blocked}
                  title={blocked ? '정원이 가득 찼어요' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    blocked ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                    : assigned ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
                  }`}>
                  {assigned ? '배정 해제' : '배정'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-colors">닫기</button>
        </div>
      </div>
    </div>
  );
}

// ─── 일별 노선 관리 ────────────────────────────────────────────────────────────

function DailyRouteView({ onAddVehicle }: { onAddVehicle: () => void }) {
  const { vehicles, drivers, students, instructors, settings } = useStore();
  const todayKorean = KOREAN_DAY_BY_JS_INDEX[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(todayKorean);
  const [sortMode, setSortMode] = useState<'route' | 'time'>('route');

  const sortedVehicles = [...vehicles].sort((a, b) => a.route.localeCompare(b.route));

  // 시간별: 같은 출발시간의 차량을 하나로 묶어 시간 단위 그룹으로 재구성
  const timeGroups = Object.values(
    vehicles.reduce<Record<string, Vehicle[]>>((acc, v) => {
      (acc[v.departureTime] ??= []).push(v);
      return acc;
    }, {})
  )
    .map(vehiclesAtTime => ({
      time: vehiclesAtTime[0].departureTime,
      vehicles: vehiclesAtTime,
      riders: vehiclesAtTime
        .flatMap(v => students
          .filter(s => v.studentIds.includes(s.id) && getEarliestEnrollmentForDay(s, selectedDay) !== null)
          .map(s => ({ student: s, vehicle: v, enrollment: getEarliestEnrollmentForDay(s, selectedDay)! })))
        .sort((a, b) => a.enrollment.regularTime.localeCompare(b.enrollment.regularTime)),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* 요일 선택 */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-0.5 shadow-sm w-fit">
          {WEEK_DAYS.map(day => (
            <button key={day} onClick={() => setSelectedDay(day)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-150 ${selectedDay === day ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'} ${day === todayKorean ? 'ring-1 ring-cyan-400 ring-offset-1' : ''}`}>
              {day}요일
            </button>
          ))}
        </div>

        {/* 정렬 기준 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">정렬</span>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-0.5 shadow-sm">
            {([['route', '노선별'], ['time', '시간별']] as const).map(([mode, label]) => (
              <button key={mode} onClick={() => setSortMode(mode)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-150 ${sortMode === mode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <EmptyStateGuide
            icon={Car}
            title="첫 차량 운영을 등록해보세요"
            description="차량과 기사, 탑승 학생 정보를 연결하면 오늘의 노선 관리와 배차 흐름이 훨씬 명확해져요."
            ctaLabel="차량 추가"
            onCta={onAddVehicle}
          />
        </div>
      ) : sortMode === 'route' ? (
        sortedVehicles.map(vehicle => {
          const driver = drivers.find(d => d.id === vehicle.driverId);
          const ridingStudents = students
            .filter(s => vehicle.studentIds.includes(s.id) && getEarliestEnrollmentForDay(s, selectedDay) !== null)
            .map(s => ({ student: s, enrollment: getEarliestEnrollmentForDay(s, selectedDay)! }))
            .sort((a, b) => a.enrollment.regularTime.localeCompare(b.enrollment.regularTime));

          return (
            <div key={vehicle.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                    <Car className="w-4.5 h-4.5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-slate-800 text-sm font-semibold">{vehicle.vehicleNumber} <span className="text-slate-400 font-normal">· {vehicle.route || '노선 없음'}</span></p>
                    <p className="text-slate-400 text-xs mt-0.5">{driver?.name ?? '기사 미배정'} 기사 · 출발 {vehicle.departureTime}</p>
                  </div>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{selectedDay}요일 {ridingStudents.length}명 탑승</span>
              </div>

              {ridingStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">{selectedDay}요일에 탑승하는 학생이 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {['순서', '학생명', '담당 강사', '승차', '하차'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ridingStudents.map(({ student: s, enrollment }, idx) => {
                        const instructor = instructors.find(i => i.id === enrollment.instructorId);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5 text-slate-400 text-xs">{idx + 1}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {s.studentName[0]}
                                </div>
                                <span className="font-semibold text-slate-800">{s.studentName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-500">{instructor?.name ?? '-'}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5 text-emerald-700">
                                <LogIn className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-medium">{vehicle.departureTime}</span>
                                <span className="text-slate-400 text-xs truncate max-w-[160px]">· {s.address || '주소 없음'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5 text-orange-700">
                                <LogOut className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-medium">{enrollment.regularTime}</span>
                                <span className="text-slate-400 text-xs">· {settings.academyName}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      ) : (
        // 시간별: 같은 출발시간대 차량을 하나로 묶어서 표시
        timeGroups.map(group => (
          <div key={group.time} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4.5 h-4.5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{group.time} 출발</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {group.vehicles.map(v => v.vehicleNumber).join(', ')} · 차량 {group.vehicles.length}대
                  </p>
                </div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{selectedDay}요일 {group.riders.length}명 탑승</span>
            </div>

            {group.riders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">{selectedDay}요일에 탑승하는 학생이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['순서', '학생명', '차량', '담당 강사', '승차', '하차'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.riders.map(({ student: s, vehicle, enrollment }, idx) => {
                      const instructor = instructors.find(i => i.id === enrollment.instructorId);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {s.studentName[0]}
                              </div>
                              <span className="font-semibold text-slate-800">{s.studentName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">{vehicle.vehicleNumber}</td>
                          <td className="px-5 py-3.5 text-slate-500">{instructor?.name ?? '-'}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-emerald-700">
                              <LogIn className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-medium">{vehicle.departureTime}</span>
                              <span className="text-slate-400 text-xs truncate max-w-[160px]">· {s.address || '주소 없음'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-orange-700">
                              <LogOut className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-medium">{enrollment.regularTime}</span>
                              <span className="text-slate-400 text-xs">· {settings.academyName}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminVehicles() {
  const { drivers, vehicles, students, addDriver, updateDriver, deleteDriver, addVehicle, updateVehicle, deleteVehicle } = useStore();

  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'daily'>('drivers');
  const [driverModal, setDriverModal] = useState<{ mode: 'add' | 'edit'; driver?: Driver } | null>(null);
  const [vehicleModal, setVehicleModal] = useState<{ mode: 'add' | 'edit'; vehicle?: Vehicle } | null>(null);
  const [assignModal, setAssignModal] = useState<Vehicle | null>(null);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [deleteDriverConfirm, setDeleteDriverConfirm] = useState<Driver | null>(null);
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState<Vehicle | null>(null);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-800">차량 관리</h1>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">차량, 기사, 탑승 학생을 관리합니다</p>
      </div>

      <div className="shrink-0 flex border-b border-slate-200 bg-white px-6">
        <button onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'drivers' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <User className="w-4 h-4" /> 기사 관리
        </button>
        <button onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'vehicles' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <Car className="w-4 h-4" /> 차량 노선 관리
        </button>
        <button onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'daily' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <CalendarDays className="w-4 h-4" /> 일별 노선 관리
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">

          {activeTab === 'daily' && <DailyRouteView onAddVehicle={() => setVehicleModal({ mode: 'add' })} />}

          {/* ── Drivers ── */}
          {activeTab === 'drivers' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600" />
                <h2 className="text-[14px] font-semibold text-slate-700">기사 관리</h2>
                <span className="text-xs text-slate-400">{drivers.length}명</span>
              </div>
              <button onClick={() => setDriverModal({ mode: 'add' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" /> 기사 추가
              </button>
            </div>

            {drivers.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">등록된 기사가 없습니다.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {drivers.map(driver => {
                  const assignedVehicle = vehicles.find(v => v.driverId === driver.id);
                  return (
                    <div key={driver.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-800 text-sm font-semibold">{driver.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-slate-400 text-xs">{driver.phone || '전화번호 없음'}</span>
                          {assignedVehicle && (
                            <span className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
                              {assignedVehicle.vehicleNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDriverModal({ mode: 'edit', driver })}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteDriverConfirm(driver)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* ── Vehicles ── */}
          {activeTab === 'vehicles' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-600" />
                <h2 className="text-[14px] font-semibold text-slate-700">차량 노선 관리</h2>
                <span className="text-xs text-slate-400">{vehicles.length}대</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setVehicleModal({ mode: 'add' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> 차량 추가
                </button>
              </div>
            </div>

            {vehicles.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">등록된 차량이 없습니다.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {vehicles.map(vehicle => {
                  const driver = drivers.find(d => d.id === vehicle.driverId);
                  const assignedStudents = students.filter(s => vehicle.studentIds.includes(s.id));
                  const isExpanded = expandedVehicle === vehicle.id;

                  return (
                    <div key={vehicle.id}>
                      <div className="px-6 py-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                            <Car className="w-5 h-5 text-cyan-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-slate-800 text-sm font-semibold">{vehicle.vehicleNumber}</p>
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">정원 {vehicle.capacity}명</span>
                              {assignedStudents.length >= vehicle.capacity && (
                                <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">만석</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {vehicle.route || '노선 없음'}
                              </span>
                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 출발 {vehicle.departureTime}
                              </span>
                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                <User className="w-3 h-3" /> {driver?.name ?? '기사 미배정'}
                              </span>
                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                <Users className="w-3 h-3" /> {assignedStudents.length}/{vehicle.capacity}명 탑승
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setAssignModal(vehicle)}
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs font-medium transition-colors">
                              학생 배정
                            </button>
                            <button onClick={() => setVehicleModal({ mode: 'edit', vehicle })}
                              className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteVehicleConfirm(vehicle)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setExpandedVehicle(isExpanded ? null : vehicle.id)}
                              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 ml-14 animate-fade-up">
                            <p className="text-xs font-medium text-slate-500 mb-2">탑승 학생 목록</p>
                            {assignedStudents.length === 0 ? (
                              <p className="text-slate-400 text-xs py-2">배정된 학생이 없습니다.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {assignedStudents.map(s => (
                                  <div key={s.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      {s.studentName[0]}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-slate-700 text-sm font-medium">{s.studentName}</p>
                                      <p className="text-slate-400 text-xs">{s.address || '주소 없음'}</p>
                                    </div>
                                    <span className="text-slate-400 text-xs">{s.regularDays.join('·')} {s.regularTime}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}
      {driverModal && (
        <DriverFormModal
          title={driverModal.mode === 'add' ? '기사 추가' : '기사 정보 수정'}
          initial={driverModal.driver}
          onClose={() => setDriverModal(null)}
          onSave={data => driverModal.mode === 'add' ? addDriver(data) : updateDriver(driverModal.driver!.id, data)}
        />
      )}
      {vehicleModal && (
        <VehicleFormModal
          title={vehicleModal.mode === 'add' ? '차량 추가' : '차량 정보 수정'}
          initial={vehicleModal.vehicle}
          onClose={() => setVehicleModal(null)}
          onSave={data => vehicleModal.mode === 'add' ? addVehicle({ ...data, studentIds: [] }) : updateVehicle(vehicleModal.vehicle!.id, data)}
        />
      )}
      {assignModal && <AssignStudentsModal vehicle={assignModal} onClose={() => setAssignModal(null)} />}

      {deleteDriverConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-slate-800 font-semibold">기사 삭제</h3>
                <p className="text-slate-500 text-sm">{deleteDriverConfirm.name} 기사를 삭제합니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDriverConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={() => { deleteDriver(deleteDriverConfirm.id); setDeleteDriverConfirm(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}

      {deleteVehicleConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-slate-800 font-semibold">차량 삭제</h3>
                <p className="text-slate-500 text-sm">{deleteVehicleConfirm.vehicleNumber} 차량을 삭제합니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteVehicleConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={() => { deleteVehicle(deleteVehicleConfirm.id); setDeleteVehicleConfirm(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
