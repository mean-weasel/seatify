import { vi } from 'vitest';

export const mockResendSend = vi.fn();

export const createMockResend = () => ({
  emails: {
    send: mockResendSend,
  },
});

export const resetResendMocks = () => {
  mockResendSend.mockReset();
  mockResendSend.mockResolvedValue({ data: { id: 'mock-resend-id' }, error: null });
};
