// 中原大學上課節次時間（依「上課節次時間一覽表」）
export const PERIODS = [
  { label: "A", start: "07:10", end: "08:00" },
  { label: "1", start: "08:10", end: "09:00" },
  { label: "2", start: "09:10", end: "10:00" },
  { label: "3", start: "10:10", end: "11:00" },
  { label: "4", start: "11:10", end: "12:00" },
  { label: "B", start: "12:10", end: "13:00" },
  { label: "5", start: "13:10", end: "14:00" },
  { label: "6", start: "14:10", end: "15:00" },
  { label: "7", start: "15:10", end: "16:00" },
  { label: "8", start: "16:10", end: "17:00" },
  { label: "C", start: "17:05", end: "17:55" },
  { label: "D", start: "18:00", end: "18:50" },
  { label: "E", start: "18:55", end: "19:45" },
  { label: "F", start: "19:50", end: "20:40" },
  { label: "G", start: "20:45", end: "21:35" },
];

export function findPeriod(label: string) {
  return PERIODS.find((p) => p.label === label);
}

// "5-6" → ["5", "6"]；"6" → ["6", "6"]
export function parsePeriodLabel(label: string | null): [string, string] {
  if (!label) return ["", ""];
  const [from, to] = label.split("-");
  return [from, to ?? from];
}
