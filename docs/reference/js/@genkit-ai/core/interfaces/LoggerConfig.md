# Interface: LoggerConfig

Provides a Winston {LoggerOptions} configuration for building a Winston
logger. This logger will be used to write genkit debug logs.

## Methods

### getLogger()

```ts
getLogger(env: string): any
```

Gets the logger used for writing generic log statements

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `env` | `string` |

#### Returns

`any`

#### Source

[core/src/telemetryTypes.ts:34](https://github.com/firebase/genkit/blob/2b0be364306d92a8e7d13efc2da4fb04c1d21e29/js/core/src/telemetryTypes.ts#L34)