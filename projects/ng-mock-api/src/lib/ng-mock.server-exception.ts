export type MockServerError = {
    message: string,
    statusCode: number
}

export class MockServerException extends Error {

    statusCode = 0

    constructor(error: MockServerError) {
        super(error.message)
        this.statusCode = error.statusCode
    }
}