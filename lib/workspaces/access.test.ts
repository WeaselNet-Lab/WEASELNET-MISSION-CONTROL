import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  developmentPreviewDenialReason,
  hostnameFromHost,
  isDevelopmentPreviewAllowed,
} from "@/lib/workspaces/access";

describe("development preview access", () => {
  it("denies production regardless of Host", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "[::1]:43147",
      "evil.example",
      null,
    ]) {
      assert.equal(
        isDevelopmentPreviewAllowed({ nodeEnv: "production", host }),
        false,
      );
    }
    assert.equal(
      developmentPreviewDenialReason({
        nodeEnv: "production",
        host: "localhost",
      }),
      "Development workspace previews are unavailable in production.",
    );
  });

  it("accepts localhost and 127.0.0.1 in development", () => {
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: "localhost:43147",
      }),
      true,
    );
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: "127.0.0.1",
      }),
      true,
    );
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: "[::1]:43147",
      }),
      true,
    );
  });

  it("denies non-loopback hosts in development", () => {
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: "mission.local:43147",
      }),
      false,
    );
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: "192.168.1.10:43147",
      }),
      false,
    );
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: "0.0.0.0:43147",
      }),
      false,
    );
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: null,
      }),
      false,
    );
  });

  it("does not grant access from forwarded-host values", () => {
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: "mission.local:43147",
        forwardedHost: "localhost",
      }),
      false,
    );
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "production",
        host: "evil.example",
        forwardedHost: "127.0.0.1",
      }),
      false,
    );
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: null,
        forwardedHost: "localhost",
      }),
      false,
    );
  });

  it("handles malformed and port-bearing Host values", () => {
    assert.equal(hostnameFromHost("localhost:43147"), "localhost");
    assert.equal(hostnameFromHost("127.0.0.1:43147"), "127.0.0.1");
    assert.equal(hostnameFromHost("[::1]:43147"), "::1");
    assert.equal(hostnameFromHost("["), null);
    assert.equal(hostnameFromHost(""), null);
    assert.equal(hostnameFromHost("   "), null);
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: "[",
      }),
      false,
    );
    assert.equal(
      isDevelopmentPreviewAllowed({
        nodeEnv: "development",
        host: ":43147",
      }),
      false,
    );
  });
});
