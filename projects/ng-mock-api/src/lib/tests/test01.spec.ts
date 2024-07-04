import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, provideHttpClient } from '@angular/common/http';
import { Injectable, Input, numberAttribute } from "@angular/core";
import { TestBed } from '@angular/core/testing';
import { MockApi, MockGet, MockPathParam, MockQueryParam } from "../ng-mock.decorator";
import { NgMockApiInterceptor } from "../ng-mock.interceptor";
import { firstValueFrom } from 'rxjs';

@Injectable({providedIn: 'root'})
@MockApi('/api/test/:id')
export class TestMockApi {

    @Input()

    @MockGet('/all')
    getAll(
        @MockPathParam('id', numberAttribute) id: number, 
        @MockQueryParam('qid', numberAttribute) qid: number) {

        console.log(id)
        console.log(qid)

    }
}


describe('TestMockApi', () => {
    let httpClient: HttpClient;
    beforeEach(async () => {
        TestBed.configureTestingModule({
            
            providers: [
                provideHttpClient(),
                {provide: HTTP_INTERCEPTORS, useClass: NgMockApiInterceptor, multi: true}
            ]
          });
      
          
          httpClient = TestBed.inject(HttpClient);
          
    });
  
    it('should create the app', async () => {
        
        const get = httpClient.get('/api/test/0123456/all', {params: {qid: 45678}})
        const result = await firstValueFrom(get)
        console.log(result)
    });  

    
   
  });
  