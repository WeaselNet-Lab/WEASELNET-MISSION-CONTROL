import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getWorkspaceConfig,
  getWorkspaceNav,
  isModuleEnabled,
  listPreviewWorkspaces,
  workspaceConfigs,
} from "@/lib/workspaces/fixtures";
import {
  ASK_ALFRED_PREVIEW,
  DEV_PREVIEW_PROXY_MATCHER,
  askAlfredPreviewAllowsAction,
  isDevPreviewProxyPath,
  isWorkspacePreviewPath,
  recordingArtifactLabel,
  resolveShellNav,
  shouldMountOperatorProvider,
  shouldShowOperatorControls,
} from "@/lib/workspaces/shell";
import {
  OPERATOR_MODULE_IDS,
  STUDENT_MODULE_IDS,
} from "@/lib/workspaces/types";

describe("workspace fixtures and isolation", () => {
  it("exposes three fictional workspace configs", () => {
    const list = listPreviewWorkspaces();
    assert.equal(list.length, 3);
    assert.deepEqual(
      list.map((item) => item.id).sort(),
      ["operator-josh", "student-alpha", "student-bravo"],
    );
  });

  it("resolves known workspace IDs only to their own configuration", () => {
    const alpha = getWorkspaceConfig("student-alpha");
    const bravo = getWorkspaceConfig("student-bravo");
    assert.ok(alpha);
    assert.ok(bravo);
    assert.equal(alpha.ownerId, "owner-student-alpha");
    assert.equal(bravo.ownerId, "owner-student-bravo");
    assert.notEqual(alpha.ownerId, bravo.ownerId);
    assert.equal(
      alpha.recordings.every((recording) => recording.ownerId === alpha.ownerId),
      true,
    );
    assert.equal(
      bravo.recordings.every((recording) => recording.ownerId === bravo.ownerId),
      true,
    );
    assert.equal(alpha.recordings.length, 1);
    assert.equal(bravo.recordings.length, 0);
  });

  it("treats an unknown workspace ID as missing (not-found input)", () => {
    assert.equal(getWorkspaceConfig("missing"), undefined);
    assert.equal(getWorkspaceConfig("student-alpha%2f../student-bravo"), undefined);
  });

  it("keeps Alpha and Bravo navigation scoped to their own home paths", () => {
    const alpha = workspaceConfigs["student-alpha"];
    const bravo = workspaceConfigs["student-bravo"];
    const alphaNav = getWorkspaceNav(alpha);
    const bravoNav = getWorkspaceNav(bravo);

    assert.ok(alphaNav.every((item) => item.href.startsWith(alpha.homePath)));
    assert.ok(bravoNav.every((item) => item.href.startsWith(bravo.homePath)));
    assert.equal(
      alphaNav.some((item) => item.href.includes("student-bravo")),
      false,
    );
    assert.equal(
      bravoNav.some((item) => item.href.includes("student-alpha")),
      false,
    );

    const alphaShell = resolveShellNav("/dev/workspaces/student-alpha");
    const bravoShell = resolveShellNav("/dev/workspaces/student-bravo");
    assert.equal(
      alphaShell.some((item) => item.href.includes("student-bravo")),
      false,
    );
    assert.equal(
      bravoShell.some((item) => item.href.includes("student-alpha")),
      false,
    );
  });

  it("keeps Josh on existing Mission Control module routes", () => {
    const josh = workspaceConfigs["operator-josh"];
    assert.equal(josh.role, "operator");
    assert.equal(josh.homePath, "/");
    assert.deepEqual(josh.enabledModules, [...OPERATOR_MODULE_IDS]);

    const nav = getWorkspaceNav(josh);
    assert.ok(nav.some((item) => item.href === "/"));
    assert.ok(nav.some((item) => item.href === "/projects"));
    assert.equal(
      nav.some((item) => item.href.startsWith("/dev/")),
      false,
    );
  });

  it("uses one student module set with distinct configuration", () => {
    const alpha = workspaceConfigs["student-alpha"];
    const bravo = workspaceConfigs["student-bravo"];
    assert.deepEqual(alpha.enabledModules, [...STUDENT_MODULE_IDS]);
    assert.deepEqual(bravo.enabledModules, [...STUDENT_MODULE_IDS]);
    assert.notDeepEqual(alpha.subjects, bravo.subjects);

    for (const moduleId of STUDENT_MODULE_IDS) {
      assert.equal(isModuleEnabled(alpha, moduleId), true);
      assert.equal(isModuleEnabled(bravo, moduleId), true);
    }
  });

  it("keeps mock recording metadata honest via artifactPresent", () => {
    const alpha = getWorkspaceConfig("student-alpha");
    assert.ok(alpha);
    const recording = alpha.recordings[0];
    assert.equal(recording.filename, "alfred-ingest-test-01.mkv");
    assert.equal(recording.artifactPresent, false);
    assert.equal(
      recordingArtifactLabel(recording.artifactPresent),
      "Artifact present: no · not ingest proof",
    );
    assert.equal(recordingArtifactLabel(true), "Artifact present: yes");
  });

  it("keeps Ask Alfred disabled with no network, storage, or mutation", () => {
    assert.equal(askAlfredPreviewAllowsAction(), false);
    assert.equal(ASK_ALFRED_PREVIEW.enabled, false);
    assert.equal(ASK_ALFRED_PREVIEW.network, false);
    assert.equal(ASK_ALFRED_PREVIEW.persistence, false);
    assert.equal(ASK_ALFRED_PREVIEW.mutation, false);
  });

  it("does not use real family names in fixtures", () => {
    const blob = JSON.stringify(workspaceConfigs).toLowerCase();
    assert.equal(blob.includes("daughter"), false);
  });
});

describe("shell isolation for preview vs Josh routes", () => {
  it("hides operator controls on all /dev/workspaces paths including the index", () => {
    assert.equal(shouldShowOperatorControls("/dev/workspaces"), false);
    assert.equal(shouldShowOperatorControls("/dev/workspaces/"), false);
    assert.equal(shouldShowOperatorControls("/dev/workspaces/student-alpha"), false);
    assert.equal(shouldMountOperatorProvider("/dev/workspaces"), false);
    assert.equal(
      shouldMountOperatorProvider("/dev/workspaces/student-bravo"),
      false,
    );
  });

  it("keeps Josh route shell controls on normal Mission Control paths", () => {
    for (const path of [
      "/",
      "/projects",
      "/drop",
      "/departments",
      "/publish",
      "/hardware",
      "/tools",
      "/exfil",
    ]) {
      assert.equal(shouldShowOperatorControls(path), true);
      assert.equal(shouldMountOperatorProvider(path), true);
      assert.deepEqual(resolveShellNav(path), [
        { href: "/", label: "Ops" },
        { href: "/projects", label: "Projects" },
        { href: "/drop", label: "Drop" },
        { href: "/departments", label: "Labs" },
        { href: "/publish", label: "Publish" },
        { href: "/hardware", label: "Bay" },
        { href: "/tools", label: "Tools" },
        { href: "/exfil", label: "Exfil" },
      ]);
    }
  });

  it("marks workspace preview paths correctly", () => {
    assert.equal(isWorkspacePreviewPath("/dev/workspaces"), true);
    assert.equal(isWorkspacePreviewPath("/dev/workspaces/student-alpha"), true);
    assert.equal(isWorkspacePreviewPath("/projects"), false);
    assert.equal(isWorkspacePreviewPath("/dev"), false);
  });
});

describe("dev preview proxy matcher coverage", () => {
  it("exports a matcher covering the /dev preview route tree", () => {
    // Must stay identical to the static matcher literal in proxy.ts.
    assert.deepEqual([...DEV_PREVIEW_PROXY_MATCHER], ["/dev/:path*"]);
    assert.equal(isDevPreviewProxyPath("/dev"), true);
    assert.equal(isDevPreviewProxyPath("/dev/workspaces"), true);
    assert.equal(isDevPreviewProxyPath("/dev/workspaces/student-alpha"), true);
    assert.equal(isDevPreviewProxyPath("/projects"), false);
    assert.equal(isDevPreviewProxyPath("/"), false);
  });
});

/*
 * Remaining test gap (no browser/RSC harness in this phase):
 * - End-to-end Next proxy rewrite status codes
 * - App Router notFound() HTTP response for unknown workspaceId at request time
 * Documented intentionally; pure helpers cover the ownership and shell contracts.
 */
