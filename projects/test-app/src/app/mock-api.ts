import { Injectable, booleanAttribute, inject, numberAttribute } from "@angular/core";
import { MockApi, MockGet, MockHttpReq, MockPathParam, MockQueryParam } from "../../../ng-mock-api/src/public-api";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { MockServerException } from "../../../ng-mock-api/src/lib/ng-mock.server-exception";
import { MockHttpRequest } from "../../../ng-mock-api/src/lib/helpers";


// injected instance call
@MockApi('/api/users')
@Injectable({ providedIn: 'root' })
export class MockUserBackendApi {

    httpClient = inject(HttpClient)

    @MockGet('')
    getAll(req: MockHttpRequest) {
        const filter = req.params.get('filter')
        return [100, 200, 300, filter]
    }

    @MockGet(':id')
    async getUserById(
        // @MockPathParam('id', numberAttribute) id: number,
        // @MockQueryParam('features', { transform: booleanAttribute }) getFeatures: boolean
        @MockHttpReq() req: MockHttpRequest
    ) {
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

        throw new MockServerException({ statusCode: 404, message: 'Not Found' })

        return {
            write: false,
            read: true
        }
    }

}