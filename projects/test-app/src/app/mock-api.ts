import { HttpClient, HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import { Injectable, inject, numberAttribute } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { MockApi, MockHttpRequest, MockGet, MockHttpReq, MockPathParam } from "ng-mock-api";


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