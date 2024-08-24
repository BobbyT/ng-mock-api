# NgMockApi

## Decorators

- `@MockApi(path: string)`
- `@MockGet(path: string, status: number)`
- `@MockPost(path: string, status: number)`
- `@MockPut(path: string, status: number)`
- `@MockPatch(path: string, status: number)`
- `@MockDelete(path: string, status: number)`
- `@MockPathParam(name: string, transform?: (v: any) => any)`
- `@MockQueryParam(name: string, options?: MockParamOptions)`
- `@MockBodyParam()`
- `@MockHttpReq()` 


## Import Providers
app.config 
```TS
import './mock-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)],
};
```

## Define Mock Api
mock-api
```TS
// injected instance call
@MockApi('/api/users')
@Injectable({ providedIn: 'root' })
export class MockUserBackendApi {

    httpClient = inject(HttpClient)

    @MockGet('')
    getAll(@MockHttpReq() req: MockHttpRequest) {
        const filter = req.params.get('filter')
        return [100, 200, 300, filter]
    }

    @MockGet(':id')
    async getUserById(@MockHttpReq() req: MockHttpRequest) {
        const id = req.path['id'];
        const features = await firstValueFrom(this.httpClient.get(`/api/features/${id}`))

        return {
            id,
            features
        }
    }

}

// injected instance call
@Injectable({ providedIn: 'root' })
@MockApi('/api/features')
export class MockFeatureBackendApi {

    @MockGet(':uid')
    getFeaturesForUser(@MockPathParam('uid', numberAttribute) uid: number) {
        return [1, 2, 3, 4]
    }

    @MockGet(':uid/details')
    getFeaturesForUserDetails(@MockPathParam('uid', numberAttribute) uid: number) {
        return ["details"]
    }
}

// Static function Call
@MockApi('/api/rights')
export class MockRightsApi {

    @MockGet('', 204)
    getRights() {
        throw new HttpErrorResponse({ status: HttpStatusCode.NotFound, statusText: 'Not Found' })
    }

}

```