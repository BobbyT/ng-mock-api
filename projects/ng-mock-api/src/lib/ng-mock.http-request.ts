import { HttpRequest } from "@angular/common/http";

export class MockHttpRequest {

    originalRequest: HttpRequest<any>;

    path: Record<string, string>

    get params() {
        return this.originalRequest.params
    }

    get body() {
        return this.originalRequest.body
    }

    get headers() {
        return this.originalRequest.headers
    }

    constructor(req: HttpRequest<any>, path: Record<string, string>) {
        this.originalRequest = req;
        this.path = path
    }
}