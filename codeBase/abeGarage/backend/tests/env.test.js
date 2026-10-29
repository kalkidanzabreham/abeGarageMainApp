// Startup configuration check: the API refuses to start with bad settings.
const loadEnv = (overrides) => {
  const saved = { ...process.env };
  Object.assign(process.env, overrides);
  for (const [k, v] of Object.entries(overrides)) if (v === undefined) delete process.env[k];
  try {
    let config;
    jest.isolateModules(() => {
      // keep backend/.env out of this test
      jest.doMock("dotenv", () => ({ config: () => ({}) }));
      config = require("../config/env");
    });
    return config;
  } finally {
    process.env = saved;
  }
};

test("valid settings load, with defaults applied and CORS origins split", () => {
  const config = loadEnv({ CORS_ORIGINS: "http://a.test, http://b.test", PORT: undefined });
  expect(config.PORT).toBe(5000);
  expect(config.CORS_ORIGINS).toEqual(["http://a.test", "http://b.test"]);
});

test("a missing JWT_SECRET stops startup", () => {
  expect(() => loadEnv({ JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
});

test("a JWT_SECRET shorter than 32 characters stops startup", () => {
  expect(() => loadEnv({ JWT_SECRET: "short" })).toThrow(/at least 32 characters/);
});

test("a missing DB_HOST stops startup", () => {
  expect(() => loadEnv({ DB_HOST: undefined })).toThrow(/DB_HOST/);
});

test("CORS_ORIGINS is required in production", () => {
  expect(() => loadEnv({ NODE_ENV: "production", CORS_ORIGINS: undefined })).toThrow(/CORS_ORIGINS/);
});
