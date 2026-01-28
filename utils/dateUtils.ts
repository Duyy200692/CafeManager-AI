export const formatDateVN = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh'
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

export const formatShortDateVN = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

export const getDayOfWeekVN = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const day = date.getDay();
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[day];
  } catch (e) {
    return '';
  }
};