import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Injectable, numberAttribute } from "@angular/core";
import { TestBed } from '@angular/core/testing';
import { MockApi, MockGet, MockPathParam, MockQueryParam } from "../ng-mock.decorator";
import { mockApiInterceptor } from "../ng-mock.interceptor";
import { MockServerException } from '../ng-mock.server-exception';

@Injectable({ providedIn: 'root' })
@MockApi('/api/test/:id')
export class TestMockApi {

    @MockGet('/all')
    async getAll(
        @MockPathParam('id', numberAttribute) id: number,
        @MockQueryParam('qid', { transform: numberAttribute }) qid: number) {
        return [id, qid]
    }

    @MockGet('')
    getError(@MockPathParam('id', numberAttribute) id: number) {
        if (id > 100) {
            return { status: 'ok' }
        } else {
            throw new MockServerException({ statusCode: 400, message: 'Bad Request' })
        }
    }
}


describe('TestMockApi', () => {
    let httpClient: HttpClient;

    beforeEach(async () => {
        TestBed.configureTestingModule({

            providers: [
                provideHttpClient(withInterceptors([mockApiInterceptor])),
            ]
        });

        httpClient = TestBed.inject(HttpClient);
    });

    it('should return id and query paramter', () => {

        httpClient.get<number[]>('/api/test/123456/all', { params: { qid: 45678 } })
            .subscribe({
                next: value => {
                    expect(value.length).toBe(2)
                    expect(value[0]).toEqual(123456)
                    expect(value[1]).toBe(45678)
                },
                error: err => {
                    console.log(err)
                }
            })
    });

    it('should create a Bad Request', () => {

        httpClient.get<number[]>('/api/test/45')
            .subscribe({
                next: value => {

                },
                error: err => {
                    console.log(err)
                    expect(err.status).toEqual(400)
                }
            })
    });

});
