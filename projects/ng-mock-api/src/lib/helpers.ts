import { Key } from "path-to-regexp"

export type MethodPoolType = {
    method: string,
    statusCode: number,
    rootPath?: string,
    path: string,
    target: any,
    classTarget: any,
    propertyKey: any,
    descriptor: any,
    regexp: RegExp & {
        keys: Key[];
    },
    keys: Key[]
}

export const methodPool: MethodPoolType[] = []
