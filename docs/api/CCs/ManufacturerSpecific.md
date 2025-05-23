# Manufacturer Specific CC

?> CommandClass ID: `0x72`

## Manufacturer Specific CC methods

### `get`

```ts
async get(): Promise<Pick<ManufacturerSpecificCCReport, "manufacturerId" | "productType" | "productId"> | undefined>;
```

### `deviceSpecificGet`

```ts
async deviceSpecificGet(
	deviceIdType: DeviceIdType,
): Promise<MaybeNotKnown<string>>;
```

### `sendReport`

```ts
async sendReport(
	options: ManufacturerSpecificCCReportOptions,
): Promise<void>;
```

## Manufacturer Specific CC values

### `deviceId(type: DeviceIdType)`

```ts
{
	commandClass: CommandClasses["Manufacturer Specific"],
	endpoint: number,
	property: "deviceId",
	propertyKey: string,
}
```

- **label:** `Device ID (${string})`
- **min. CC version:** 2
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"string"`

### `manufacturerId`

```ts
{
	commandClass: CommandClasses["Manufacturer Specific"],
	endpoint: 0,
	property: "manufacturerId",
}
```

- **label:** Manufacturer ID
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 65535

### `productId`

```ts
{
	commandClass: CommandClasses["Manufacturer Specific"],
	endpoint: 0,
	property: "productId",
}
```

- **label:** Product ID
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 65535

### `productType`

```ts
{
	commandClass: CommandClasses["Manufacturer Specific"],
	endpoint: 0,
	property: "productType",
}
```

- **label:** Product type
- **min. CC version:** 1
- **readable:** true
- **writeable:** false
- **stateful:** true
- **secret:** false
- **value type:** `"number"`
- **min. value:** 0
- **max. value:** 65535
