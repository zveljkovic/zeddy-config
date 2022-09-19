# Zeddy Config
Zeddy config is a simple configuration library inspired by `convict` built in TypeScript. 
It closely follows suggestions written in my book 'Pragmatic Node.js development: Primer in NestJS'.
It also follows the suggestions from [The Twelve-Factor App](https://12factor.net/config) for configuring variables via environment variables 

### Usage
In `config.ts` write your schema. As this library is written in TypeScript it will
autocomplete the available fields (they depend on `type` property). Full interface of options are given below

```
import { configz, dotenvize } from "zeddy-config";

dotenvize();

export const config = configz({
  env: {
    description: "Running environment",
    envVar: "NODE_ENV",
    type: "string"
  },
  server: {
    description: "Server info",
    type: "object",
    properties: {
      port: {
        description: "Server port",
        envVar: "SERVER_PORT",
        type: "int",
        validator: (port) => {
          return port === 3000;
        }
      },
      host: {
        description: "Server host",
        envVar: "SERVER_HOST",
        type: "string"
      },
    }
  }
});
```
If you want to use .env files with overrides per NODE_ENV environment variable you can call `dotenvize()` before
`configz()` to load all necessary environment variables from `.env` file and `.env.${process.env.NODE_ENV}`files.


### Interfaces
String value interface expects environment variable in any format.
```
type ZeddyConfigSchemaStringElementInterface = {
  type: "string";
  envVar: string;
  required?: boolean; // default true
  description?: string;
  validator?: ZeddyConfigSchemaValidator;
}
```

Integer value interface expects environment variable as whole value.
```
type ZeddyConfigSchemaIntElementInterface = {
  type: "int";
  envVar: string;
  required?: boolean;
  description?: string;
  validator?: ZeddyConfigSchemaValidator;
}
```

Float value interface expects environment variable as whole or decimal value.
```
type ZeddyConfigSchemaFloatElementInterface = {
  type: "float";
  envVar: string;
  required?: boolean;
  description?: string;
  validator?: ZeddyConfigSchemaValidator;
}
```

Boolean value interface expects environment variable as true/false.
```
type ZeddyConfigSchemaBooleanElementInterface = {
  type: "boolean";
  envVar: string;
  required?: boolean;
  description?: string;
  validator?: ZeddyConfigSchemaValidator;
}
```

Object value interface serves as a grouping of environment variables.
```
type ZeddyConfigSchemaObjectElementInterface = {
  type: "object";
  properties: Record<string, ZeddyConfigSchemaElement>;
  description?: string;
 }
```
