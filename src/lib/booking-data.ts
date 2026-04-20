import { minuteToTimeLabel, nextDaysIso } from "@/lib/time";
import { appConfig } from "@/lib/app-config";

export type Slot = {
  startMinute: number;
  endMinute: number;
  label: string;
  isAvailable: boolean;
};

export const clinicMeta = {
  name: appConfig.clinicDefaults.tenantName,
  specialty: "باطنة",
  branch: appConfig.clinicDefaults.clinicName,
  slotMinutes: appConfig.clinicDefaults.slotMinutes,
  openingHour: appConfig.clinicDefaults.openingHour,
  closingHour: Math.max(
    appConfig.clinicDefaults.closingHour,
    appConfig.clinicDefaults.openingHour + 1,
  ),
  locale: appConfig.clinicDefaults.locale,
  timezone: appConfig.clinicDefaults.timezone,
};

function generateRawSlots() {
  const slots: Slot[] = [];
  const start = clinicMeta.openingHour * 60;
  const end = clinicMeta.closingHour * 60;

  for (let minute = start; minute + clinicMeta.slotMinutes <= end; minute += clinicMeta.slotMinutes) {
    slots.push({
      startMinute: minute,
      endMinute: minute + clinicMeta.slotMinutes,
      label: minuteToTimeLabel(minute),
      isAvailable: true,
    });
  }

  return slots;
}

export const upcomingDates = nextDaysIso(7);

export function getSlotsForDate(date: string) {
  const seeded = date
    .split("-")
    .map((part) => Number(part))
    .reduce((acc, value) => acc + value, 0);

  return generateRawSlots().map((slot, index) => {
    const isBlocked = (index + seeded) % 5 === 0;
    return {
      ...slot,
      isAvailable: !isBlocked,
    };
  });
}

export const dashboardSeed = {
  todayTotal: 18,
  confirmed: 13,
  cancelled: 2,
  noShow: 1,
  waitingList: 4,
};

export const dashboardAppointments = [
  {
    id: "APT-1001",
    patientName: "سارة محمود",
    time: "10:15",
    status: "confirmed",
    source: "guest",
  },
  {
    id: "APT-1002",
    patientName: "محمد تامر",
    time: "10:45",
    status: "confirmed",
    source: "patient",
  },
  {
    id: "APT-1003",
    patientName: "مريم أحمد",
    time: "11:30",
    status: "cancelled",
    source: "receptionist",
  },
  {
    id: "APT-1004",
    patientName: "خالد علي",
    time: "12:00",
    status: "no_show",
    source: "patient",
  },
  {
    id: "APT-1005",
    patientName: "نوران سمير",
    time: "12:30",
    status: "confirmed",
    source: "patient",
  },
];
