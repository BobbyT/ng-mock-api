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
        return matchApiWithDecorators(req, next.handle)
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
    return matchApiWithDecorators(req, next)
}

function matchApiWithDecorators(req: HttpRequest<unknown>, next: HttpHandlerFn) {

    const methods = methodPool.filter(mp => req.url.startsWith(mp.rootPath!) && mp.method === req.method)

    let foundMethod: MethodPoolType | null = null;
    let status = 200
    let response: Observable<any> | undefined;

    for (const method of methods) {

        const paramsMetadata: ParamMetdata[] = Reflect.getMetadata(PARAMS_METADATA_KEY, method.target.constructor, method.propertyKey)

        const bodyParams = paramsMetadata.filter(x => x.paramType === 'BODY')
        const pathParams = paramsMetadata.filter(x => x.paramType === 'PATH')
        const requiredQueryParams = paramsMetadata.filter(x => x.paramType === 'QUERY' && x.optional === false)
        const optionalQueryParams = paramsMetadata.filter(x => x.paramType === 'QUERY' && x.optional)
        const allQueryParams = paramsMetadata.filter(x => x.paramType === 'QUERY')

        const hasReqQParams = req.params.keys().length > 0

        const qparamSep = req.params.keys().reduce((acc, paramName) => {
            const qParam = allQueryParams.find(x => x.name === paramName)
            if (qParam?.optional) {
                acc.optional.push(paramName)
            } else {
                acc.required.push(paramName)
            }
            return acc
        }, { required: [] as string[], optional: [] as string[] })


        const rqsameLength = requiredQueryParams.length === qparamSep.required.length
        const isRQuery = rqsameLength && qparamSep.required.every(qname => requiredQueryParams.find(x => x.name === qname))

        const hasOptionalQuery = optionalQueryParams.length > 0
        const isOQuery = hasOptionalQuery && optionalQueryParams.some(q => qparamSep.optional.find(x => x === q.name))

        const sameLength = pathParams.length === method.keys?.length
        const isPath = sameLength && pathParams.every(x => method.keys?.find(k => k.name === x.name))

        if (isPath && isRQuery) {
            foundMethod = method
            break;
        }
    }

    if (foundMethod) {

        status = foundMethod.statusCode

        const pathKeys = foundMethod.regexp?.exec(req.url)
        const fnParams: any[] = []
        const paramsMetadata: ParamMetdata[] = Reflect.getMetadata(PARAMS_METADATA_KEY, foundMethod.target.constructor, foundMethod.propertyKey)

        paramsMetadata.forEach(arg => {
            let value;
            switch (arg.paramType) {
                case 'BODY':
                    value = req.body;
                    break;
                case 'PATH':
                    const keyIndex = foundMethod.keys?.findIndex(x => x.name === arg.name)
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


        let instance: any = foundMethod.target;

        try {
            instance = inject(foundMethod.classTarget)
        } catch { }

        let result: any;

        let statusText = ''
        try {
            result = instance[foundMethod.propertyKey](...fnParams)
        } catch (e) {
            if (e instanceof MockServerException) {
                status = e.statusCode
                statusText = e.message
            }
        }

        const responseObs = result && result['then'] && typeof result['then'] === 'function'
            ? from(result)
            : of(result)

        response = responseObs.pipe(map(body => {
            if (status < 400) {
                new HttpResponse({ body, status })
            } else {
                throw new HttpErrorResponse({ status, statusText })
            }
        }))

    }

    return response ?? next(req)
}