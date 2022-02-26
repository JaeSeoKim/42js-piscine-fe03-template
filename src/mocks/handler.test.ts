import { server } from "./node";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { hasSyncCheckFinished, user, __MOCK_JWT_KEY } from "./handlers";
import axios from "axios";

axios.defaults.validateStatus = () => true;

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const newAuthToken = () =>
  jwt.sign(
    {
      id: uuid(),
    },
    __MOCK_JWT_KEY
  );

describe("[POST] /api/login", () => {
  test("401", async () => {
    const { status } = await axios.post("/api/login");
    expect(status).toBe(401);
  });

  test("200", async () => {
    const {
      status,
      data: { token },
    } = await axios.post("/api/login", {
      id: "hello world!",
      password: "hello world!",
    });
    expect(status).toBe(200);
    jwt.verify(token, __MOCK_JWT_KEY);
  });
});

describe("[GET] /api/me", () => {
  test("401", async () => {
    const {
      status,
      data: { message },
    } = await axios.get("/api/me", {
      headers: {
        Authorization: `Bearer ${"invaild token"}`,
      },
    });

    expect(status).toBe(401);
    expect(message).toBe("Unauthorized");
  });

  test("200", async () => {
    const { status, data } = await axios.get("/api/me", {
      headers: {
        Authorization: `Bearer ${newAuthToken()}`,
      },
    });

    expect(status).toBe(200);
    expect(data).toStrictEqual(user);
  });
});

describe("[GET] /api/me/sync", () => {
  test("401", async () => {
    const {
      status,
      data: { message },
    } = await axios.get("/api/me/sync", {
      headers: {
        Authorization: `Bearer ${"invaild token"}`,
      },
    });

    expect(status).toBe(401);
    expect(message).toBe("Unauthorized");
  });
  test("200", async () => {
    const { status } = await axios.get("/api/me/sync", {
      headers: {
        Authorization: `Bearer ${newAuthToken()}`,
      },
    });

    expect(status).toBe(200);
  });
});
describe("[GET] /api/me/sync/progress", () => {
  test("401", async () => {
    const {
      status,
      data: { message },
    } = await axios.get("/api/me/sync/progress", {
      headers: {
        Authorization: `Bearer ${"invaild token"}`,
      },
    });

    expect(status).toBe(401);
    expect(message).toBe("Unauthorized");
  });
  test("200", async () => {
    const {
      status,
      data: { hasFinished },
    } = await axios.get("/api/me/sync/progress", {
      headers: {
        Authorization: `Bearer ${newAuthToken()}`,
      },
    });

    expect(status).toBe(200);
    expect(hasFinished).toBe(hasSyncCheckFinished);
  });
});

describe("[GET] /api/accounts/{accountId}", () => {
  test("404", async () => {
    const {
      status,
      data: { message },
    } = await axios.get(`/api/accounts/${"invaild acount number..."}`);
    expect(status).toBe(404);
    expect(message).toBe("account not found");
  });
  test("200 - user accounts", async () => {
    for (const account of user.accounts) {
      const { status, data } = await axios.get(
        `/api/accounts/${account.account_number}`
      );

      expect(status).toBe(200);
      expect(data).toStrictEqual({
        owner: user.name,
        name: account.name,
        bank: account.bank,
        account_number: account.account_number,
      });
    }
  });

  test("200 - random accounts", async () => {
    const accountId = uuid();
    const {
      status,
      data: { account_number },
    } = await axios.get(`/api/accounts/${accountId}`);

    expect(status).toBe(200);
    expect(account_number).toBe(accountId);
  });
});

describe("[POST] /api/remit", () => {
  test("400", async () => {
    const {
      status,
      data: { message },
    } = await axios.post(
      "/api/remit",
      {},
      {
        headers: {
          Authorization: `Bearer ${newAuthToken()}`,
        },
      }
    );

    expect(status).toBe(400);
    expect(message).toBe("Invaild body");
  });

  test("401", async () => {
    const {
      status,
      data: { message },
    } = await axios.post(
      "/api/remit",
      {},
      {
        headers: {
          Authorization: `Bearer ${"invaild token"}`,
        },
      }
    );

    expect(status).toBe(401);
    expect(message).toBe("Unauthorized");
  });

  test("404", async () => {
    const {
      status,
      data: { message },
    } = await axios.post(
      "/api/remit",
      {
        amount: 912_000,
        from: "1231231231231",
        to: user.accounts[0].account_number,
      },
      {
        headers: {
          Authorization: `Bearer ${newAuthToken()}`,
        },
      }
    );

    expect(status).toBe(404);
    expect(message).toBe("account not found");
  });

  test("403", async () => {
    const {
      status,
      data: { message },
    } = await axios.post(
      "/api/remit",
      {
        amount: user.accounts[0].balance + 100,
        from: user.accounts[0].account_number,
        to: uuid(),
        msg: "2022년 2월 지원금!",
      },
      {
        headers: {
          Authorization: `Bearer ${newAuthToken()}`,
        },
      }
    );

    expect(status).toBe(403);
    expect(message).toBe("balance is insufficient");
  });

  test("200", async () => {
    const { status, data } = await axios.post(
      "/api/remit",
      {
        amount: 912_000,
        from: uuid(),
        to: user.accounts[0].account_number,
        msg: "2022년 2월 지원금!",
      },
      {
        headers: {
          Authorization: `Bearer ${newAuthToken()}`,
        },
      }
    );

    expect(status).toBe(200);
    expect(data).toStrictEqual(user.accounts);
  });
});
