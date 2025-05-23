import { type ZWaveApiVersion, ZWaveLibraryTypes } from "@zwave-js/core";
import { FunctionType } from "@zwave-js/serial";

export interface MockControllerCapabilities {
	firmwareVersion: string;
	manufacturerId: number;
	productType: number;
	productId: number;
	supportedFunctionTypes: FunctionType[];

	zwaveApiVersion: ZWaveApiVersion;
	controllerType: ZWaveLibraryTypes;
	libraryVersion: string;

	isSecondary: boolean;
	isUsingHomeIdFromOtherNetwork: boolean;
	isSISPresent: boolean;
	wasRealPrimary: boolean;
	isStaticUpdateController: boolean;
	noNodesIncluded: boolean;
	sucNodeId: number;

	supportsTimers: boolean;
	zwaveChipType?:
		| string
		| {
			type: number;
			version: number;
		};

	supportsLongRange: boolean;
	watchdogEnabled: boolean;
}

export function getDefaultSupportedFunctionTypes(): FunctionType[] {
	return [
		FunctionType.GetSerialApiInitData,
		FunctionType.GetControllerCapabilities,
		FunctionType.SendData,
		FunctionType.SendDataMulticast,
		FunctionType.SendDataBridge,
		FunctionType.SendDataMulticastBridge,
		FunctionType.GetControllerVersion,
		FunctionType.GetControllerId,
		FunctionType.GetNodeProtocolInfo,
		FunctionType.RequestNodeInfo,
		FunctionType.AssignSUCReturnRoute,
		FunctionType.AddNodeToNetwork,
		FunctionType.RemoveNodeFromNetwork,
	];
}

export function getDefaultMockControllerCapabilities(): MockControllerCapabilities {
	return {
		firmwareVersion: "1.0",
		manufacturerId: 0xffff,
		productType: 0xffff,
		productId: 0xfffe,
		supportedFunctionTypes: getDefaultSupportedFunctionTypes(),

		controllerType: ZWaveLibraryTypes["Static Controller"],
		libraryVersion: "Z-Wave 7.17.99",
		zwaveApiVersion: {
			kind: "legacy",
			version: 9,
		},

		isSecondary: false,
		isSISPresent: true,
		isStaticUpdateController: true,
		wasRealPrimary: true,
		isUsingHomeIdFromOtherNetwork: false,
		noNodesIncluded: false,
		sucNodeId: 0,

		supportsTimers: false,
		zwaveChipType: {
			// EFR32ZG14 / ZGM130S
			type: 0x07,
			version: 0x00,
		},

		supportsLongRange: false,
		watchdogEnabled: false,
	};
}
