import { fs } from "@zwave-js/core/bindings/fs/node";
import type { ZWaveSerialStream } from "@zwave-js/serial";
import type { MockPort } from "@zwave-js/serial/mock";
import { copyFilesRecursive, noop } from "@zwave-js/shared";
import type {
	MockController,
	MockControllerOptions,
	MockNode,
	MockNodeOptions,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import crypto from "node:crypto";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { type TestContext, test } from "vitest";
import type { Driver } from "../driver/Driver.js";
import type { PartialZWaveOptions } from "../driver/ZWaveOptions.js";
import type { ZWaveNode } from "../node/Node.js";
import { prepareDriver, prepareMocks } from "./integrationTestSuiteShared.js";

interface IntegrationTestOptions {
	/** Enable debugging for this integration tests. When enabled, a driver logfile will be written and the test directory will not be deleted after each test. Default: false */
	debug?: boolean;
	/** If given, the files from this directory will be copied into the test cache directory prior to starting the driver. */
	provisioningDirectory?: string;
	/** Whether the recorded messages and frames should be cleared before executing the test body. Default: true. */
	clearMessageStatsBeforeTest?: boolean;
	controllerCapabilities?: MockControllerOptions["capabilities"];
	nodeCapabilities?: Pick<MockNodeOptions, "id" | "capabilities">[];
	customSetup?: (
		driver: Driver,
		mockController: MockController,
		mockNodes: MockNode[],
	) => Promise<void>;
	testBody: (
		t: TestContext,
		driver: Driver,
		nodes: ZWaveNode[],
		mockController: MockController,
		mockNodes: MockNode[],
	) => Promise<void>;
	additionalDriverOptions?: PartialZWaveOptions;
}

export interface IntegrationTestFn {
	(name: string, options: IntegrationTestOptions): void;
}
export interface IntegrationTest extends IntegrationTestFn {
	/** Only runs the tests inside this `integrationTest` suite for the current file */
	only: IntegrationTestFn;
	/** Skips running the tests inside this `integrationTest` suite for the current file */
	skip: IntegrationTestFn;
}

function suite(
	name: string,
	options: IntegrationTestOptions,
	modifier?: "only" | "skip",
) {
	const {
		controllerCapabilities,
		nodeCapabilities,
		customSetup,
		testBody,
		debug = false,
		provisioningDirectory,
		clearMessageStatsBeforeTest = true,
		additionalDriverOptions,
	} = options;

	let driver: Driver;
	let mockPort: MockPort;
	let serial: ZWaveSerialStream;
	let continueStartup: () => void;
	let mockController: MockController;
	let mockNodes: MockNode[];
	let nodes: ZWaveNode[];

	const cacheDir = path.join(
		os.tmpdir(),
		`zjs_test_cache_${crypto.randomBytes(4).toString("hex")}`,
	);

	async function prepareTest() {
		if (debug) {
			console.log(`Running integration test in directory ${cacheDir}`);
		}

		// Make sure every test is starting fresh
		await fsp.rm(cacheDir, { recursive: true, force: true }).catch(noop);
		await fsp.mkdir(cacheDir, { recursive: true });

		// And potentially provision the cache
		if (provisioningDirectory) {
			await copyFilesRecursive(fs, provisioningDirectory, cacheDir);
		}

		({ driver, continueStartup, mockPort, serial } = await prepareDriver(
			cacheDir,
			debug,
			additionalDriverOptions,
		));
		({ mockController, mockNodes } = prepareMocks(
			mockPort,
			serial,
			{
				capabilities: controllerCapabilities,
			},
			// TODO: This isn't ideal as it requires us to provide the
			// node capabilities in addition to the provisioning directory
			nodeCapabilities,
		));

		if (customSetup) {
			await customSetup(driver, mockController, mockNodes);
		}

		// Wait for all nodes to be ready
		return new Promise<void>((resolve) => {
			driver.once("driver ready", async () => {
				const promises: Promise<void>[] = [];
				nodes = [];
				for (const mockNode of mockNodes) {
					const node = driver.controller.nodes.getOrThrow(
						mockNode.id,
					);
					nodes.push(node);

					const onReady = (resolve: () => void) => {
						if (clearMessageStatsBeforeTest) {
							mockNode.clearReceivedControllerFrames();
							mockNode.clearSentControllerFrames();
						}

						process.nextTick(resolve);
					};

					promises.push(
						new Promise<void>((resolve) => {
							if (
								options.additionalDriverOptions?.testingHooks
									?.skipNodeInterview
							) {
								onReady(resolve);
							} else {
								node.once("ready", () => onReady(resolve));
							}
						}),
					);
				}

				await Promise.all(promises);
				if (clearMessageStatsBeforeTest) {
					mockController.clearReceivedHostMessages();
				}
				process.nextTick(resolve);
			});

			continueStartup();
		});
	}

	// Integration tests need to run in serial, or they might block the serial port on CI
	const fn = modifier === "only"
		? test.sequential.only
		: modifier === "skip"
		? test.sequential.skip
		: test.sequential;
	fn(name, async (t) => {
		t.onTestFinished(async () => {
			// Give everything a chance to settle before destroying the driver.
			await wait(100);

			await driver.destroy();
			if (!debug) {
				await fsp.rm(cacheDir, { recursive: true, force: true })
					.catch(noop);
			}
		});

		await prepareTest();
		await testBody(t, driver, nodes, mockController, mockNodes);
	}, 30000);
}

/** Performs an integration test with a real driver using a mock controller and one mock node */
export const integrationTest = ((
	name: string,
	options: IntegrationTestOptions,
): void => {
	suite(name, options);
}) as IntegrationTest;

integrationTest.only = (name: string, options: IntegrationTestOptions) => {
	suite(name, options, "only");
};

integrationTest.skip = (name: string, options: IntegrationTestOptions) => {
	suite(name, options, "skip");
};
