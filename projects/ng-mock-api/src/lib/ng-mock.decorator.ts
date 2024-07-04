import { pathToRegexp } from "path-to-regexp";
import "reflect-metadata";
import { methodPool } from "./helpers";

type MockHttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT'
type MockHttpParamType = 'PATH' | 'QUERY' | 'BODY'

export type ParamMetdata = {
    name: string,
    index: number,
    paramType: MockHttpParamType,
    transform: (value: any) => any,
    optional: boolean
}

export type MockParamOptions = {
    transform?: (value: any) => any,
    optional?: boolean
}

export const PARAMS_METADATA_KEY = 'ngMockParamsMetadataKey__'

export function MockApi(path: string): ClassDecorator {
    return (target: any) => {

        methodPool
            .filter(mp => mp.target.constructor === target)
            .forEach(method => {
                const fullPath = method.path ? path + '/' + method.path : path
                const regexp = pathToRegexp(fullPath)

                method.rootPath = path
                method.path = fullPath
                method.regexp = regexp
                method.keys = regexp.keys
                method.classTarget = target

            })
    }
}

function createHttpMethod(method: MockHttpMethod, path: string, statusCode: number): MethodDecorator {
    return (target: any, propertyKey: any, descriptor: any) => {

        Reflect.defineMetadata(
            PARAMS_METADATA_KEY,
            [],
            target.constructor,
            propertyKey,
        );

        methodPool.push({
            method,
            statusCode,
            path,
            target,
            classTarget: null,
            propertyKey,
            descriptor,
            regexp: {} as any,
            keys: []
        })
    }
}

function createHttpParam(paramType: MockHttpParamType, name: string, options?: MockParamOptions): ParameterDecorator {
    return (target: any, propertyKey: any, index: number) => {

        const { transform, optional } = options ?? { transform: undefined, optional: false }

        const params = Reflect.getMetadata(PARAMS_METADATA_KEY, target.constructor, propertyKey) || [];

        const mergedParams = creteParamsMetadata(
            params,
            paramType,
            name,
            index,
            !!optional,
            transform,
        )

        Reflect.defineMetadata(
            PARAMS_METADATA_KEY,
            mergedParams,
            target.constructor,
            propertyKey,
        );
    }
}

function creteParamsMetadata(
    params: ParamMetdata[],
    paramType: MockHttpParamType,
    name: string,
    index: number,
    optional: boolean,
    transform?: (value: any) => any,
) {
    return [
        ...params,
        {
            name,
            paramType,
            index,
            transform,
            optional
        },
    ];
}



export const MockPathParam = (name: string, transform?: (value: any) => any) => createHttpParam('PATH', name, { transform })
export const MockQueryParam = (name: string, options?: MockParamOptions) => createHttpParam('QUERY', name, options)
export const MockBodyParam = (name: string) => createHttpParam('BODY', name)

export const MockGet = (path: string, status = 200) => createHttpMethod("GET", path, status)
export const MockPost = (path: string, status = 201) => createHttpMethod("POST", path, status)
export const MockPut = (path: string, status = 200) => createHttpMethod("PUT", path, status)
export const MockDelete = (path: string, status = 204) => createHttpMethod("DELETE", path, status)