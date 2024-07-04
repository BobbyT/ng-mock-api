import { HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent, HttpHandler, HttpHandlerFn, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http'
import { Injectable, inject, makeEnvironmentProviders } from '@angular/core';
import { Observable, firstValueFrom, from, map, of, tap } from 'rxjs';
import { MethodPoolType, methodPool } from './helpers';
import { MockApi, ParamMetdata, PARAMS_METADATA_KEY } from './ng-mock.decorator';
import { MockUserBackendApi } from '../../../test-app/src/app/mock-api';
import { MockServerException } from './ng-mock.server-exception';

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

    let foundMethod = matchUrlToMethod(req);
    let response: Observable<any> | undefined;

    if (foundMethod) {
        const fnParams = getTargetParams(foundMethod, req);
        response = callTargetFn(foundMethod, fnParams)
    }

    return response ?? next(req)
}

function matchUrlToMethod(req: HttpRequest<any>) {

    let foundMethod: MethodPoolType | null = null;
    const methods = methodPool.filter(mp => req.url.startsWith(mp.rootPath!) && mp.method === req.method)

    for (const method of methods) {

        const paramsMetadata: ParamMetdata[] = Reflect.getMetadata(PARAMS_METADATA_KEY, method.target.constructor, method.propertyKey)

        const bodyParams = paramsMetadata.filter(x => x.paramType === 'BODY')
        const pathParams = paramsMetadata.filter(x => x.paramType === 'PATH')
        const requiredQueryParams = paramsMetadata.filter(x => x.paramType === 'QUERY' && x.optional === false)
        const optionalQueryParams = paramsMetadata.filter(x => x.paramType === 'QUERY' && x.optional)
        const allQueryParams = paramsMetadata.filter(x => x.paramType === 'QUERY')

        const hasReqQParams = req.params.keys().length > 0

        const qparamSep = req.params.keys()
            .reduce(
                (acc, paramName) => {
                    const qParam = allQueryParams.find(x => x.name === paramName)
                    if (qParam?.optional) {
                        acc.optional.push(paramName)
                    } else {
                        acc.required.push(paramName)
                    }
                    return acc
                },
                { required: [] as string[], optional: [] as string[] }
            )


        const rqsameLength = requiredQueryParams.length === qparamSep.required.length
        const isRequestQueryMatching = rqsameLength && qparamSep.required.every(qname => requiredQueryParams.find(x => x.name === qname))

        const hasOptionalQuery = optionalQueryParams.length > 0
        const isOQuery = hasOptionalQuery && optionalQueryParams.some(q => qparamSep.optional.find(x => x === q.name))

        const sameLength = pathParams.length === method.keys?.length
        const isPathMatching = sameLength && pathParams.every(x => method.keys?.find(k => k.name === x.name))

        if (isPathMatching && isRequestQueryMatching) {
            foundMethod = method
            break;
        }
    }

    return foundMethod
}

function getTargetParams(method: MethodPoolType, req: HttpRequest<any>) {
    const pathKeys = method.regexp?.exec(req.url)
    const fnParams: any[] = []
    const paramsMetadata: ParamMetdata[] = Reflect.getMetadata(PARAMS_METADATA_KEY, method.target.constructor, method.propertyKey)

    paramsMetadata.forEach(arg => {
        let value;
        switch (arg.paramType) {
            case 'BODY':
                value = req.body;
                break;
            case 'PATH':
                const keyIndex = method.keys?.findIndex(x => x.name === arg.name)
                if (pathKeys && keyIndex !== -1) {
                    const offsetIndex = keyIndex + 1
                    value = pathKeys[offsetIndex];
                }
                break;
            case 'QUERY':
                value = req.params.get(arg.name)
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

    let result: any;

    let statusText = ''
    try {
        result = instance[method.propertyKey](...fnParams)
    } catch (e) {
        if (e instanceof MockServerException) {
            status = e.statusCode
            statusText = e.message
        }
    }

    const responseObs = result && result['then'] && typeof result['then'] === 'function'
        ? from(result)
        : of(result)

    const response = responseObs.pipe(map(body => {
        if (status < 400) {
            new HttpResponse({ body, status })
        } else {
            throw new HttpErrorResponse({ status, statusText })
        }
    }))

    return response
}