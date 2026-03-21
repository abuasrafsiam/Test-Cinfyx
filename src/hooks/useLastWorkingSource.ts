export function useLastWorkingSource() {
  const STORAGE_KEY = "cinefyx_last_working_sources";

  const getLastWorking = (videoId: string): number => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return data[videoId] ?? 0; // 0 = primary, 1 = backup1, 2 = backup2
    } catch {
      return 0;
    }
  };

  const saveLastWorking = (videoId: string, sourceIndex: number) => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      data[videoId] = sourceIndex;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  };

  const clearLastWorking = (videoId: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      delete data[videoId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  };

  return { getLastWorking, saveLastWorking, clearLastWorking };
}
