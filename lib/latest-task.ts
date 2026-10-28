// Ignore results from work that belongs to an earlier selection or request.
export function createLatestTask() {
  let revision = 0;
  return {
    invalidate() { revision++; },
    async run<T>(task: () => Promise<T>, success: (value: T) => void, failure: (error: unknown) => void, settled: () => void = () => {}) {
      const request = ++revision;
      try {
        const value = await task();
        if (request === revision) success(value);
      } catch (error) {
        if (request === revision) failure(error);
      } finally {
        if (request === revision) settled();
      }
    },
  };
}
