import request from 'supertest';
import app from '@/app';

const user = request.agent(app);
const fakeWallet = "0x0000000000000000000000000000000000000000"
const realWallet = "0x861efc0989df42d793e3147214fffca4d124cae8"

describe('Claims', () => {
    describe('POST /claims/:wallet', () => {
        it('HTTP 200 if OK', (done) => {
            user.post('/v1/claims/wallet/')
                .send({ wallet: realWallet })
                .expect(200, done);
        });

        it('HTTP 400 if wallet already exists', (done) => {
            user.post('/v1/claims/wallet/')
                .send({ wallet: realWallet })
                .expect((res: request.Response) => {
                    expect(res.body.message).toBe('Wallet already exists!');
                })
                .expect(400, done);
        });
    });

    describe('GET /claims/:wallet', () => {
        it('existing wallet claim to be true', (done) => {
            user.get('/v1/claims/' + realWallet)
                .expect((res: request.Response) => {
                    expect(res.body).toBe(true);
                })
                .expect(200, done);
        });
        it('fake wallet claim to be false', (done) => {
            user.get('/v1/claims/' + fakeWallet)
                .expect((res: request.Response) => {
                    expect(res.body).toBe(false);
                })
                .expect(200, done);
        });
    });
});
