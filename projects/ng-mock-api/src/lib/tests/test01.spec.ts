import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Injectable, Input, numberAttribute } from "@angular/core";
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MockApi, MockGet, MockPathParam, MockQueryParam } from "../ng-mock.decorator";
import { NgMockApiInterceptor, mockApiInterceptor } from "../ng-mock.interceptor";
import { delay, first, firstValueFrom, lastValueFrom, of } from 'rxjs';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

@Injectable({ providedIn: 'root' })
@MockApi('/api/test/:id')
export class TestMockApi {

    @MockGet('/all')
    getAll(
        @MockPathParam('id', numberAttribute) id: number,
        @MockQueryParam('qid', { transform: numberAttribute }) qid: number) {
        return [id, qid]
    }
}


describe('TestMockApi', () => {
    let httpClient: HttpClient;
    let httpTesting: HttpTestingController;

    beforeEach(async () => {
        TestBed.configureTestingModule({

            providers: [
                provideHttpClient(withInterceptors([mockApiInterceptor])),
                // provideHttpClientTesting()
                // { provide: HTTP_INTERCEPTORS, useClass: NgMockApiInterceptor, multi: true }
            ]
        });


        httpClient = TestBed.inject(HttpClient);
        // httpTesting = TestBed.inject(HttpTestingController)

    });

    it('should create the app', () => {

        httpClient.get<number[]>('/api/test/0123456/all', { params: { qid: 45678 } })
            .subscribe({
                next: value => {
                    debugger
                    console.log(value)
                    expect(value.length).toBe(5)
                },
                error: err => {
                    console.log(err)
                }
            })



    });

});
