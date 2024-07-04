import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AppService {

    httpClient = inject(HttpClient)

    getUsers(filter?: string) {
        const params: any = {}
        if (filter) params.filter = filter
        return this.httpClient.get('/api/users', { params })
    }

    getUser(id: number, features: boolean) {
        return this.httpClient.get(`/api/users/${id}`, { params: { features } })
    }

    getFeatures(id: number) {
        return this.httpClient.get(`/api/features/${id}`)
    }

    getRights() {
        return this.httpClient.get(`/api/rights`)
    }


}