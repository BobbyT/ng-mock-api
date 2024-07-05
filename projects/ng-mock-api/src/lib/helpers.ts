import { HttpRequest } from "@angular/common/http";
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


export class MockHttpRequest {

    originalRequest: HttpRequest<any>;

    path: Record<string, string>

    get params() {
        return this.originalRequest.params
    }

    get body() {
        return this.originalRequest.body
    }

    get headers() {
        return this.originalRequest.headers
    }

    constructor(req: HttpRequest<any>, path: Record<string, string>) {
        this.originalRequest = req;
        this.path = path
    }
}