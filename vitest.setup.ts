import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

// Enable fake timers before each test so vi.setSystemTime() works.
// shouldAdvanceTime: true lets real-time pass so waitFor() works correctly.
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
