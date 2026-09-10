"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const auth_1 = require("./auth");
describe('Auth', () => {
    let service;
    beforeEach(() => {
        testing_1.TestBed.configureTestingModule({});
        service = testing_1.TestBed.inject(auth_1.Auth);
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
