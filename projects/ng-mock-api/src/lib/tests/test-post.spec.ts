import { HttpClient, HttpErrorResponse, HttpStatusCode, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Injectable, numberAttribute } from "@angular/core";
import { TestBed } from '@angular/core/testing';
import { MockApi, MockBodyParam, MockPathParam, MockPost, mockApiInterceptor } from '..';
import { firstValueFrom, of } from 'rxjs';
import { expect, it, describe, beforeEach } from 'vitest';

@Injectable({ providedIn: 'root' })
@MockApi('/api/test-post/:id')
export class TestMockApiPost {

    @MockPost('/all')
    async getAll(
        @MockPathParam('id', numberAttribute) id: number,
        @MockBodyParam() body: any) {
        return [id, body.qid]
    }

    @MockPost('')
    getError(@MockPathParam('id', numberAttribute) id: number) {
        if (id > 100) {
            return { status: 'ok' }
        } else {
            throw new HttpErrorResponse({ status: HttpStatusCode.BadRequest, statusText: 'Bad Request' })
        }
    }

    @MockPost('obs')
    getObs(@MockPathParam('id', numberAttribute) id: number) {
        return of(id)
    }

    @MockPost('void')
    getVoid() {
    }
}


describe('Test POST MockApi', () => {
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

        const post = httpClient.post<number[]>('/api/test-post/123456/all', { qid: 45678 })
        const value = await firstValueFrom(post)

        expect(value.length).toBe(2)
        expect(value[0]).toEqual(123456)
        expect(value[1]).toBe(45678)
    });

    it('should have status code 201', async () => {

        const post = httpClient.post<number[]>('/api/test-post/123456/all', { qid: 45678 }, { observe: 'response' })
        const response = await firstValueFrom(post)
        const value = response.body

        expect(response.status).toEqual(201)

        if (value) {
            expect(value.length).toBe(2)
            expect(value[0]).toEqual(123456)
            expect(value[1]).toBe(45678)
        }
    });

    it('should create a Bad Request', () => {

        httpClient.post('/api/test-post/45', {})
            .subscribe({
                next: value => {

                },
                error: err => {
                    expect(err.status).toEqual(400)
                }
            })
    });

    it('should resolve observable', async () => {
        const id = 6500;
        const post = httpClient.post(`/api/test-post/${id}/obs`, { id })
        const value = await firstValueFrom(post)
        expect(value).toBe(id)
    });

    it('should resolve void', async () => {
        const id = 6500;
        const post = httpClient.post<void>(`/api/test-post/${id}/void`, {})
        const value = await firstValueFrom(post);
        expect(value).toBeNull()
    });

});
