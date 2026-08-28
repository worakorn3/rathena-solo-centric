import { describe, expect, it, mock, beforeEach } from "bun:test";

// Mock DB pool BEFORE importing the service
const queryMock = mock(() => Promise.resolve([]));
const queryOneMock = mock(() => Promise.resolve(null));
const primaryExecuteMock = mock(() => Promise.resolve({ affectedRows: 1, insertId: 1 }));
const primaryQueryMock = mock(() => Promise.resolve([]));
const primaryQueryOneMock = mock(() => Promise.resolve(null));

mock.module("../src/db/pool", () => ({
  query: queryMock,
  queryOne: queryOneMock,
  primaryExecute: primaryExecuteMock,
  primaryQuery: primaryQueryMock,
  primaryQueryOne: primaryQueryOneMock,
}));

import { EconomyService } from "../src/services/economy.service";

describe("Bank Deposit Interest Rollover & Fractional Preservation Test Suite", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryOneMock.mockReset();
    primaryExecuteMock.mockReset();
    primaryQueryMock.mockReset();
    primaryQueryOneMock.mockReset();

    queryMock.mockImplementation(() => Promise.resolve([]));
    queryOneMock.mockImplementation(() => Promise.resolve(null));
    primaryExecuteMock.mockImplementation(() => Promise.resolve({ affectedRows: 1, insertId: 1 }));
    primaryQueryMock.mockImplementation(() => Promise.resolve([]));
    primaryQueryOneMock.mockImplementation(() => Promise.resolve(null));

    EconomyService.clearBankConfigCache();
  });

  describe("Dynamic SQL Bank Config", () => {
    it("should load custom bank parameters from solo_bank_config table", async () => {
      queryMock.mockResolvedValueOnce([
        { config_key: "interest_rate_bps", config_value: 200 }, // 2% daily
        { config_key: "max_accrual_days", config_value: 15 },   // 15 days max
        { config_key: "deposit_fee_bps", config_value: 500 },    // 5% fee (divisor 20)
        { config_key: "max_principal_limit", config_value: 2000000000 },
        { config_key: "min_deposit_zeny", config_value: 500 },
      ]);

      const config = await EconomyService.getBankConfig();
      expect(config.dailyInterestRate).toBe(0.02);
      expect(config.maxAccrualDays).toBe(15);
      expect(config.depositFeeRate).toBe(0.05);
      expect(config.depositFeeDivisor).toBe(20);
      expect(config.maxPrincipalLimit).toBe(2000000000);
      expect(config.minDepositZeny).toBe(500);
    });
  });

  describe("depositBank", () => {
    it("should preserve fractional sub-day progress (e.g. 12 hours) and compound 1-day interest", async () => {
      const now = Math.floor(Date.now() / 1000);
      const twelveHoursSeconds = 12 * 3600; // 43200s
      const oneDayAndHalfAgo = now - (86400 + twelveHoursSeconds); // 1.5 days ago

      // 1. Character lookup
      primaryQueryOneMock.mockResolvedValueOnce({
        char_id: 150001,
        name: "TestNovice",
        zeny: 10000000,
        online: 0,
      });

      // 2. Existing bank balance (10,000,000 Z deposited 1.5 days ago)
      primaryQueryOneMock.mockResolvedValueOnce({
        principal: 10000000,
        deposit_time: oneDayAndHalfAgo,
      });

      // Deposit 1,000,000 Z (Default Fee: 20,000 Z, Net: 980,000 Z)
      // Pending interest for 1 day = 10,000,000 * 0.01 * 1 = 100,000 Z
      // New principal = 10,000,000 + 100,000 + 980,000 = 11,080,000 Z
      // Preserved sub-day remainder = 43200s (12 hours)
      // New deposit_time = now - 43200
      const res = await EconomyService.depositBank(1, 150001, 1000000);
      expect(res.success).toBe(true);
      expect(res.newPrincipal).toBe(11080000);
      expect(res.interestPaid).toBe(100000);
      expect(res.feePaid).toBe(20000);

      // Check DB update
      const bankInsertCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("INSERT INTO `solo_bank_account`")
      );
      expect(bankInsertCall).toBeDefined();
      const params = bankInsertCall![1];
      expect(params[0]).toBe(1); // accountId
      expect(params[1]).toBe(11080000); // newPrincipal
      // deposit_time should be approximately (now - 43200)
      expect(params[2]).toBeLessThanOrEqual(now - twelveHoursSeconds + 2);
      expect(params[2]).toBeGreaterThanOrEqual(now - twelveHoursSeconds - 2);
      expect(params[3]).toBe(100000); // interest_paid_total increment
    });

    it("should start clean deposit_time on fresh first deposit", async () => {
      const now = Math.floor(Date.now() / 1000);

      primaryQueryOneMock.mockResolvedValueOnce({
        char_id: 150001,
        name: "TestNovice",
        zeny: 5000000,
        online: 0,
      });
      primaryQueryOneMock.mockResolvedValueOnce(null); // No existing bank row

      const res = await EconomyService.depositBank(1, 150001, 1000000);
      expect(res.success).toBe(true);
      expect(res.newPrincipal).toBe(980000); // 1M - 20k fee
      expect(res.interestPaid).toBe(0);

      const bankInsertCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("INSERT INTO `solo_bank_account`")
      );
      expect(bankInsertCall).toBeDefined();
      expect(bankInsertCall![1][1]).toBe(980000);
      expect(bankInsertCall![1][2]).toBeGreaterThanOrEqual(now - 2);
    });

    it("should cap pending interest at max accrual days and clear subday remainder once capped", async () => {
      const now = Math.floor(Date.now() / 1000);
      const fifteenDaysAgo = now - (15 * 86400);

      primaryQueryOneMock.mockResolvedValueOnce({
        char_id: 150001,
        name: "TestNovice",
        zeny: 5000000,
        online: 0,
      });
      primaryQueryOneMock.mockResolvedValueOnce({
        principal: 10000000,
        deposit_time: fifteenDaysAgo,
      });

      // 10% max interest = 1,000,000 Z (under default 10 days cap)
      const res = await EconomyService.depositBank(1, 150001, 1000000);
      expect(res.success).toBe(true);
      expect(res.interestPaid).toBe(1000000);
      expect(res.newPrincipal).toBe(10000000 + 1000000 + 980000);

      const bankInsertCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("INSERT INTO `solo_bank_account`")
      );
      expect(bankInsertCall).toBeDefined();
      // Since daysAccrued >= 10, subdayRemainder is 0, so deposit_time resets to now
      expect(bankInsertCall![1][2]).toBeGreaterThanOrEqual(now - 2);
      expect(bankInsertCall![1][3]).toBe(1000000);
    });
  });

  describe("withdrawBank", () => {
    it("should preserve fractional sub-day remainder on partial withdrawal", async () => {
      const now = Math.floor(Date.now() / 1000);
      const eighteenHoursSeconds = 18 * 3600;
      const twoDaysAndEighteenHoursAgo = now - (2 * 86400 + eighteenHoursSeconds);

      primaryQueryOneMock.mockResolvedValueOnce({
        char_id: 150001,
        name: "TestNovice",
        zeny: 100000,
        online: 0,
      });
      primaryQueryOneMock.mockResolvedValueOnce({
        principal: 10000000,
        deposit_time: twoDaysAndEighteenHoursAgo,
      });

      // Total Available: 10,000,000 + 200,000 = 10,200,000 Z
      // Partial withdraw: 5,000,000 Z
      // Remaining Principal: 5,200,000 Z
      // Preserved subday remainder: 18 hours (64800s)
      const res = await EconomyService.withdrawBank(1, 150001, 5000000);
      expect(res.success).toBe(true);
      expect(res.newPrincipal).toBe(5200000);
      expect(res.interestPaid).toBe(200000);

      const updateCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("UPDATE `solo_bank_account` SET principal = ?")
      );
      expect(updateCall).toBeDefined();
      const params = updateCall![1];
      expect(params[0]).toBe(5200000); // newPrincipal
      expect(params[1]).toBeLessThanOrEqual(now - eighteenHoursSeconds + 2); // newDepositTime
      expect(params[2]).toBe(200000); // interest_paid_total increment
    });

    it("should reset deposit_time to 0 on full withdrawal", async () => {
      const now = Math.floor(Date.now() / 1000);
      const fiveDaysAgo = now - (5 * 86400);

      primaryQueryOneMock.mockResolvedValueOnce({
        char_id: 150001,
        name: "TestNovice",
        zeny: 100000,
        online: 0,
      });
      primaryQueryOneMock.mockResolvedValueOnce({
        principal: 10000000,
        deposit_time: fiveDaysAgo,
      });

      // Full withdraw (10.5M)
      const res = await EconomyService.withdrawBank(1, 150001);
      expect(res.success).toBe(true);
      expect(res.newPrincipal).toBe(0);
      expect(res.totalPayout).toBe(10500000);

      const updateCall = primaryExecuteMock.mock.calls.find((c) =>
        (c[0] as string).includes("UPDATE `solo_bank_account` SET principal = 0, deposit_time = 0")
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1][0]).toBe(500000); // interest_paid_total increment
    });
  });

  describe("getNetWorthSummary Bank Breakdown", () => {
    it("should report subdayProgressSeconds and lifetime interestPaidTotal accurately", async () => {
      const now = Math.floor(Date.now() / 1000);
      const sixHoursSeconds = 6 * 3600;
      const threeDaysAndSixHoursAgo = now - (3 * 86400 + sixHoursSeconds);

      queryMock.mockImplementation((sql: string) => {
        if (sql.includes("FROM `char`")) {
          return Promise.resolve([{ char_id: 150001, name: "Novice", class: 0, base_level: 1, zeny: 500000 }]);
        }
        if (sql.includes("FROM `solo_bank_account`")) {
          return Promise.resolve([
            {
              principal: 20000000,
              deposit_time: threeDaysAndSixHoursAgo,
              interest_paid_total: 1500000,
            },
          ]);
        }
        if (sql.includes("FROM `solo_bank_config`")) {
          return Promise.resolve([
            { config_key: "interest_rate_bps", config_value: 100 },
            { config_key: "max_accrual_days", config_value: 10 },
            { config_key: "deposit_fee_bps", config_value: 200 },
            { config_key: "max_principal_limit", config_value: 1900000000 },
            { config_key: "min_deposit_zeny", config_value: 100 },
          ]);
        }
        return Promise.resolve([]);
      });

      const summary = await EconomyService.getNetWorthSummary(1);
      expect(summary.bank).toBeDefined();
      expect(summary.bank.principal).toBe(20000000);
      expect(summary.bank.daysAccrued).toBe(3);
      expect(summary.bank.pendingInterest).toBe(600000); // 20M * 0.01 * 3
      expect(summary.bank.interestPaidTotal).toBe(1500000);
      expect(summary.bank.interestRate).toBe(0.01);
      expect(summary.bank.maxDays).toBe(10);
      expect(summary.bank.depositFeeRate).toBe(0.02);
      expect(summary.bank.maxPrincipalLimit).toBe(1900000000);
      expect(summary.bank.subdayProgressSeconds).toBeGreaterThanOrEqual(sixHoursSeconds - 2);
      expect(summary.bank.subdayProgressSeconds).toBeLessThanOrEqual(sixHoursSeconds + 2);
    });
  });
});
