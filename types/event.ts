export type EventType = {
  id: number;
  calendarId: number;
  userId: number;
  title: string;
  memo: string | null;
  startTime: string;
  endTime: string;
  userName: string;
};
