import * as dotenv from 'dotenv';

type ZeddyConfigSchemaElementType = "string" | "int" | "float" | "boolean" | "object";
type ZeddyConfigSchemaValidator<T> = (configElement: T, rawConfig: object) => boolean;

type ZeddyConfigSchemaStringElementInterface = {
  type: "string";
  envVar: string;
  required?: boolean;
  description?: string;
  validator?: ZeddyConfigSchemaValidator<string>;
}
type ZeddyConfigSchemaIntElementInterface = {
  type: "int";
  envVar: string;
  required?: boolean;
  description?: string;
  validator?: ZeddyConfigSchemaValidator<number>;
}
type ZeddyConfigSchemaFloatElementInterface = {
  type: "float";
  envVar: string;
  required?: boolean;
  description?: string;
  validator?: ZeddyConfigSchemaValidator<number>;
}
type ZeddyConfigSchemaBooleanElementInterface = {
  type: "boolean";
  envVar: string;
  required?: boolean;
  description?: string;
  validator?: ZeddyConfigSchemaValidator<boolean>;
}
type ZeddyConfigSchemaObjectElementInterface = {
  type: "object";
  properties: Record<string, ZeddyConfigSchemaElement>;
  description?: string;
 }
type ZeddyConfigSchemaElementInterface =
  ZeddyConfigSchemaStringElementInterface
  | ZeddyConfigSchemaIntElementInterface
  | ZeddyConfigSchemaFloatElementInterface
  | ZeddyConfigSchemaBooleanElementInterface
  | ZeddyConfigSchemaObjectElementInterface;


type ZeddyConfigJsonSchema = Record<string, ZeddyConfigSchemaElementInterface>
type ZeddyConfigReturnType<T extends ZeddyConfigSchemaElement> =
  T extends ZeddyConfigSchemaStringElementInterface ? string :
    T extends ZeddyConfigSchemaIntElementInterface ? number :
      T extends ZeddyConfigSchemaFloatElementInterface ? number :
        T extends ZeddyConfigSchemaBooleanElementInterface ? boolean :
          T extends ZeddyConfigSchemaObjectElementInterface ? { [Prop in keyof T["properties"]]: ZeddyConfigReturnType<T["properties"][Prop]> } : never

class ZeddyConfigSchemaElement  {
  public type: ZeddyConfigSchemaElementType;
  public envVar?: string;
  public required?: boolean;
  public description?: string;
  public validator?: ZeddyConfigSchemaValidator<any>;
  public properties?: Record<string, ZeddyConfigSchemaElement>;

  public constructor(schemaElement: ZeddyConfigSchemaElement) {
    this.type = schemaElement.type;
    this.envVar = schemaElement.envVar;
    this.required = schemaElement.required ?? true;
    this.description = schemaElement.description;
    this.validator = schemaElement.validator;
    this.properties = schemaElement.properties;
  }
}

export const configz = <T extends ZeddyConfigJsonSchema>(jsonSchema: T): { [Prop in keyof typeof jsonSchema]: ZeddyConfigReturnType<typeof jsonSchema[Prop]> } => {
  const schema: { [Prop in keyof T]: ZeddyConfigSchemaElement } = Object.keys(jsonSchema).reduce((carry, key) => {
    carry[key as keyof T] = new ZeddyConfigSchemaElement(jsonSchema[key]);
    return carry;
  }, {} as { [Prop in keyof T]: ZeddyConfigSchemaElement });

  const errors: string[] = [];
  const mapper = <T extends ZeddyConfigSchemaElementInterface>(name: string, el: T): ZeddyConfigReturnType<typeof el> | undefined => {
    if (el.type === "string" || el.type === 'int' || el.type === 'float' || el.type === 'boolean') {
      const value = process.env[el.envVar];
      if (!value) {
        if (el.required) {
          errors.push(`Required config element "${name}" is missing environment variable ${el.envVar}`);
          return;
        }
        return undefined;
      }

      if (el.type === 'string') {
        if (el.validator && !el.validator(value, schema)) {
          errors.push(`Config element "${name}" didn't pass the validator function`);
          return;
        }
        return value as any;
      } else if (el.type === 'int') {
        try {
          const parsedValue = parseInt(value);
          if (el.validator && !el.validator(parsedValue, schema)) {
            errors.push(`Config element "${name}" didn't pass the validator function`);
            return;
          }
          return parsedValue as any;
        } catch (e) {
          errors.push(`Config element "${name}" unable to parse "${value}" as int with parseInt()`);
          return;
        }
      } else if (el.type === 'float') {
        try {
          const parsedValue = parseFloat(value);
          if (el.validator && !el.validator(parsedValue, schema)) {
            errors.push(`Config element "${name}" didn't pass the validator function`);
            return;
          }
          return parsedValue as any;
        } catch (e) {
          errors.push(`Config element "${name}" unable to parse "${value}" as float with parseFloat()`);
          return;
        }
      } else if (el.type === 'boolean') {
        try {
          const parsedValue = Boolean(value);
          if (el.validator && !el.validator(parsedValue, schema)) {
            errors.push(`Config element "${name}" didn't pass the validator function`);
            return;
          }
          return parsedValue as any;
        } catch (e) {
          errors.push(`Config element "${name}" unable to parse "${value}" as float with parseFloat()`);
          return;
        }
      }
    }  else if (el.type === 'object') {
      const v = {} as any;
      for (const propKey of Object.keys(el.properties)) {
        v[propKey] = mapper(propKey, el.properties[propKey] as any);
      }
      return v as any;
    }
  };

  const schemaKeys = Object.keys(schema) as Array<keyof typeof schema>;
  const config = schemaKeys.reduce((carry, key) => {
    (carry as any)[key] = mapper(key as string, schema[key] as any);
    return carry;
  }, {} as { [Prop in keyof typeof schema]: ZeddyConfigReturnType<typeof schema[Prop]> });

  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  return config;
};

export const dotenvize = (config?: dotenv.DotenvConfigOptions) => {
  const mainEnv: dotenv.DotenvConfigOptions = {
    ...config,
    path: '.env',
  }
  dotenv.config(mainEnv);

  dotenv.config({
    ...config,
    path: `.env.${process.env.NODE_ENV}`,
    override: true,
  })
}
