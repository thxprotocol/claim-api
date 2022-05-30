import request from 'supertest';
import app from '@/app';
import { INSERT_WALLET_KEY } from '@/config/secrets';

const user = request.agent(app);
const token = {
    address: '0xb952d9b5de7804691e7936e88915a669b15822ef',
    type: 'THX',
};

describe('Tokens', () => {
    describe('POST /tokens/add', () => {
        it('Successful adding token messages', () => {
            user.post('/v1/tokens/add/')
                .send({
                    address: token.address,
                    type: token.type,
                    key: INSERT_WALLET_KEY,
                })
                .expect((res: request.Response) => {
                    expect(res.body.message).toBe(
                        'Token added to the database' || 'This address is already in the database',
                    );
                });
        });
    });

    describe('GET /tokens/token', () => {
        it('Match the submitted token with data', (done) => {
            user.get('/v1/tokens/token')
                .expect((res: request.Response) => {
                    expect(res.body[0]._id).toBe(token.address);
                })
                .expect(200, done);
        });
    });
});
