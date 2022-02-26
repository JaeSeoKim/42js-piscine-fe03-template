import { rest } from "msw";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import _ from "lodash";

export const __MOCK_JWT_KEY = "JavaScriptIsAwesome!";

export const BANK_LIST = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C",
  "Cpp",
  "C#",
  "Dart",
  "Ruby",
] as const;

export const USER_LIST = [
  "hello",
  "world",
  "js piscine",
  "pisciner",
  "developer",
  "ReactJS",
] as const;

export const ACCOUNT_LIST = [
  "저축예금",
  "주식거래",
  "급여계좌",
  "사업자계좌",
  "자유저축예금",
  "주텍청약",
] as const;

export let user: {
  name: string;
  accounts: {
    name: string;
    owner: string;
    bank: typeof BANK_LIST[number];
    account_number: string;
    balance: number;
  }[];
  "2FA": string;
} = {
  name: "jaeskim",
  accounts: [
    {
      name: "저축예금",
      owner: "jaeskim",
      bank: BANK_LIST[0],
      account_number: "27984eb0-e171-4eb3-bd90-9b0db53dbbb8",
      balance: 21_000_000,
    },
    {
      name: "주택청약",
      owner: "jaeskim",
      bank: BANK_LIST[1],
      account_number: "df1e6ffb-ffd5-42a8-90e6-9dcec968f5e4",
      balance: 21_000_000,
    },
  ],
  "2FA": "123456",
};

let waitSyncCheck: Promise<boolean> | undefined = undefined;
export let hasSyncCheckFinished: boolean = false;

class UnauthorizedError extends Error {
  constructor() {
    super();
    this.message = "Unauthorized";
  }
}

const testBankAccount = (account: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    account
  );

export const handlers = [
  rest.post<{
    id?: string;
    password?: string;
  }>("/api/login", async (req, res, ctx) => {
    try {
      const { id, password } = req.body;

      if (!id || !password) {
        throw new UnauthorizedError();
      }

      const token = jwt.sign(
        {
          id: id,
        },
        __MOCK_JWT_KEY
      );

      return res(
        ctx.status(200),
        ctx.json({
          token,
        })
      );
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return res(
          ctx.status(401),
          ctx.json({
            message: error.message,
          })
        );
      }
      return res(
        ctx.status(504),
        ctx.json({
          message: "Something went wrong..",
        })
      );
    }
  }),

  rest.get("/api/me", async (req, res, ctx) => {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer "))
        throw new UnauthorizedError();
      const token = authHeader.substring(7, authHeader.length);
      jwt.verify(token, __MOCK_JWT_KEY);

      return res(ctx.status(200), ctx.json(user));
    } catch (error) {
      if (
        error instanceof UnauthorizedError ||
        error instanceof JsonWebTokenError
      ) {
        return res(
          ctx.status(401),
          ctx.json({
            message: "Unauthorized",
          })
        );
      }
      return res(
        ctx.status(504),
        ctx.json({
          message: "Something went wrong..",
        })
      );
    }
  }),

  rest.get("/api/me/sync", async (req, res, ctx) => {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer "))
        throw new UnauthorizedError();
      const token = authHeader.substring(7, authHeader.length);
      jwt.verify(token, __MOCK_JWT_KEY);

      hasSyncCheckFinished = false;
      waitSyncCheck = new Promise((resolve) =>
        setTimeout(resolve, 1 * 60 * 1000)
      );
      waitSyncCheck.then(() => {
        hasSyncCheckFinished = true;
        user.accounts.push({
          owner: user.name,
          name: _.sample(ACCOUNT_LIST) as unknown as string,
          bank: _.sample(BANK_LIST) as unknown as typeof BANK_LIST[number],
          account_number: uuid(),
          balance: _.random(1_000, 100_000_000),
        });
      });

      return res(ctx.status(200));
    } catch (error) {
      if (
        error instanceof UnauthorizedError ||
        error instanceof JsonWebTokenError
      ) {
        return res(
          ctx.status(401),
          ctx.json({
            message: "Unauthorized",
          })
        );
      }
      return res(
        ctx.status(504),
        ctx.json({
          message: "Something went wrong..",
        })
      );
    }
  }),

  rest.get("/api/me/sync/progress", async (req, res, ctx) => {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer "))
        throw new UnauthorizedError();
      const token = authHeader.substring(7, authHeader.length);
      jwt.verify(token, __MOCK_JWT_KEY);

      return res(
        ctx.status(200),
        ctx.json({
          hasFinished: hasSyncCheckFinished,
        })
      );
    } catch (error) {
      if (
        error instanceof UnauthorizedError ||
        error instanceof JsonWebTokenError
      ) {
        return res(
          ctx.status(401),
          ctx.json({
            message: "Unauthorized",
          })
        );
      }
      return res(
        ctx.status(504),
        ctx.json({
          message: "Something went wrong..",
        })
      );
    }
  }),

  rest.get<{}, { accountId: string }>(
    "/api/accounts/:accountId",
    async (req, res, ctx) => {
      try {
        const { accountId } = req.params;

        if (!testBankAccount(accountId)) {
          return res(
            ctx.status(404),
            ctx.json({
              message: "account not found",
            })
          );
        }

        const accountIndex = _.findIndex(user.accounts, {
          account_number: accountId,
        });
        if (accountIndex !== -1) {
          return res(
            ctx.status(200),
            ctx.json({
              owner: user.name,
              name: user.accounts[accountIndex].name,
              bank: user.accounts[accountIndex].bank,
              account_number: user.accounts[accountIndex].account_number,
            })
          );
        }
        return res(
          ctx.status(200),
          ctx.json({
            owner: _.sample(USER_LIST),
            name: _.sample(ACCOUNT_LIST),
            bank: _.sample(BANK_LIST),
            account_number: accountId,
          })
        );
      } catch (error) {
        return res(
          ctx.status(504),
          ctx.json({
            message: "Something went wrong..",
          })
        );
      }
    }
  ),

  rest.post<{
    amount?: number;
    from?: string;
    to?: string;
    msg?: string;
  }>("/api/remit", async (req, res, ctx) => {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer "))
        throw new UnauthorizedError();
      const token = authHeader.substring(7, authHeader.length);
      jwt.verify(token, __MOCK_JWT_KEY);

      const { amount, from, to } = req.body;
      if (!amount || !from || !to) {
        return res(
          ctx.status(400),
          ctx.json({
            message: "Invaild body",
          })
        );
      }

      if (!testBankAccount(from) || !testBankAccount(to)) {
        return res(
          ctx.status(404),
          ctx.json({
            message: `account not found`,
          })
        );
      }

      const fromtIndex = _.findIndex(user.accounts, {
        account_number: from,
      });
      if (fromtIndex !== -1) {
        if (user.accounts[fromtIndex].balance < amount) {
          return res(
            ctx.status(403),
            ctx.json({
              message: `balance is insufficient`,
            })
          );
        }
        user.accounts[fromtIndex].balance -= amount;
      }

      const toIndex = _.findIndex(user.accounts, {
        account_number: to,
      });
      if (toIndex !== -1) {
        user.accounts[toIndex].balance += amount;
      }

      return res(ctx.status(200), ctx.json(user.accounts));
    } catch (error) {
      if (
        error instanceof UnauthorizedError ||
        error instanceof JsonWebTokenError
      ) {
        return res(
          ctx.status(401),
          ctx.json({
            message: "Unauthorized",
          })
        );
      }
      return res(
        ctx.status(504),
        ctx.json({
          message: "Something went wrong..",
        })
      );
    }
  }),
];
