import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpHandlerFn, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, inject, makeEnvironmentProviders } from '@angular/core';
import { match } from 'path-to-regexp';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { MethodPoolType, methodPool } from './helpers';
import { PARAMS_METADATA_KEY, ParamMetdata } from './ng-mock.decorator';
import { MockHttpRequest } from './ng-mock.http-request';

@Injectable()
export class NgMockApiInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return matchReqUrlWithMockApi(req, next.handle)
    }
}

export function provideMockApi() {
    return makeEnvironmentProviders([{
        provide: HTTP_INTERCEPTORS,
        useClass: NgMockApiInterceptor,
        multi: true
    }])
}

export function mockApiInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    return matchReqUrlWithMockApi(req, next)
}

function matchReqUrlWithMockApi(req: HttpRequest<unknown>, next: HttpHandlerFn) {

    let response: Observable<any> | undefined;

    let { foundMethod, pathParams } = matchUrlToMethod(req);

    if (foundMethod) {
        const fnParams = getTargetParams(foundMethod, req, pathParams);
        response = callTargetFn(foundMethod, fnParams)
    }

    return response ?? next(req)
}



function matchUrlToMethod(req: HttpRequest<any>) {

    let foundMethod: MethodPoolType | null = null;
    const methods = methodPool.filter(mp => mp.method === req.method)

    let pathParams: any = {}

    for (const method of methods) {
        const matchUrl = match(method.path)
        const isMatch = matchUrl(req.url)

        if (isMatch) {
            foundMethod = method
            pathParams = isMatch.params
            break;
        }
    }

    return { foundMethod, pathParams }
}

function getTargetParams(method: MethodPoolType, req: HttpRequest<any>, pathParams: Record<string, string>) {
    const pathKeys = method.regexp.exec(req.url)
    const fnParams: any[] = []
    const paramsMetadata: ParamMetdata[] = Reflect.getMetadata(PARAMS_METADATA_KEY, method.target.constructor, method.propertyKey)

    paramsMetadata.forEach(arg => {
        let value;
        switch (arg.paramType) {
            case 'BODY':
                value = req.body;
                break;
            case 'PATH':
                const keyIndex = method.keys.findIndex(x => x.name === arg.name)
                if (pathKeys && keyIndex !== -1) {
                    const offsetIndex = keyIndex + 1
                    value = pathKeys[offsetIndex];
                }
                break;
            case 'QUERY':
                value = req.params.get(arg.name)
                break;
            case 'REQUEST':
                value = new MockHttpRequest(req, pathParams)
                break;
        }
        value = arg.transform ? arg.transform(value) : value
        fnParams[arg.index] = value
    })

    return fnParams;
}

function callTargetFn(method: MethodPoolType, fnParams: any[]) {
    let instance: any = method.target;
    let status = method.statusCode;

    try {
        instance = inject(method.classTarget)
    } catch { }


    return of(true)
        .pipe(
            switchMap(
                () => {
                    const rawResult = instance[method.propertyKey](...fnParams)
                    const wrappedResult = rawResult instanceof Promise
                        ? from(rawResult)
                        : rawResult instanceof Observable
                            ? rawResult
                            : of(rawResult)
                    return wrappedResult
                }
            ),
        )
        .pipe(
            map(body => {
                return new HttpResponse({ body, status })
            })
        )

}