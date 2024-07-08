import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Injectable, numberAttribute } from "@angular/core";
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { MockApi, MockGet, MockPathParam, MockQueryParam, MockServerException, mockApiInterceptor } from '..';

@Injectable({ providedIn: 'root' })
@MockApi('/api/test-get/:id')
export class TestMockApiGet {

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

    @MockGet('obs')
    getObs(@MockPathParam('id', numberAttribute) id: number) {
        return of(id)
    }

    @MockGet('void')
    getVoid() {
    }
}


describe('Test GET MockApi', () => {
    let httpClient: HttpClient;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([mockApiInterceptor])),
            ]
        });

        httpClient = TestBed.inject(HttpClient);
    });

    it('should resolve async / promise', async () => {

        const get = httpClient.get<number[]>('/api/test-get/123456/all', { params: { qid: 45678 } })
        const value = await firstValueFrom(get)
        expect(value.length).toBe(2)
        expect(value[0]).toEqual(123456)
        expect(value[1]).toBe(45678)

    });

    it('should create a Bad Request', () => {

        httpClient.get<number[]>('/api/test-get/45')
            .subscribe({
                next: value => {

                },
                error: err => {
                    expect(err.status).toEqual(400)
                }
            })
    });

    it('should resolve observable', () => {
        const id = 6500;
        httpClient.get<number>(`/api/test-get/${id}/obs`)
            .subscribe({
                next: value => {
                    expect(value).toBe(id)
                },
                error: err => {
                }
            })
    });

    it('should resolve void', async () => {
        const id = 6500;
        const get = httpClient.get<any>(`/api/test-get/${id}/void`)
        const value = await firstValueFrom(get)
        expect(value).toBeNull()
    });


});
