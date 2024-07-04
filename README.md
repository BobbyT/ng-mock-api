# NgMockApi

```TS

// injected instance call
@MockApi('/api/users')
@Injectable({ providedIn: 'root' })
export class MockUserBackendApi {

    httpClient = inject(HttpClient)

    @MockGet('')
    getAll(@MockQueryParam('filter', { optional: true }) filter: string) {
        return [100, 200, 300, filter]
    }

    @MockGet(':id')
    async getUserById(
        @MockPathParam('id', numberAttribute) id: number,
        @MockQueryParam('features', { transform: booleanAttribute }) getFeatures: boolean) {

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
}

// Static function Call
@MockApi('/api/rights')
export class MockRightsApi {

    @MockGet('', 204)
    getRights() {

        throw new MockServerException({ statusCode: 404, message: 'Not Found' })

        return {
            write: false,
            read: true
        }
    }

}

```