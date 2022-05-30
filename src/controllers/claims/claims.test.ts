import request from 'supertest';
import app from '@/app';

const user = request.agent(app);
const fakeWallet = '0x0000000000000000000000000000000000000000';
const realWallet = '0xcb002B1561e1AEd22C3335b2687515229462c4CF';

describe('Claims', () => {
    describe('POST /claims/:wallet', () => {
        it('Successful adding wallet messages', async () => {
            await user
                .post('/v1/claims/wallet')
                .send({ wallet: realWallet })
                .expect((res: request.Response) => {
                    expect(res.body.message).not.toBe('Provided address is invalid!');
                });
        });
    });

    describe('GET /claims/:wallet', () => {
        it('Existing wallet claim to be true', (done) => {
            user.get('/v1/claims/' + realWallet)
                .expect((res: request.Response) => {
                    expect(res.body).toBe(true);
                })
                .expect(200, done);
        });
        it('Fake wallet claim to be false', (done) => {
            user.get('/v1/claims/' + fakeWallet)
                .expect((res: request.Response) => {
                    expect(res.body).toBe(false);
                })
                .expect(200, done);
        });
    });
});
