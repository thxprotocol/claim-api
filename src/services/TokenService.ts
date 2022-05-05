import { Token } from '@/models/Token';
export default class TokenService {
    static findTokenByAddress(address: string) {
        return Token.findOne({ address });
    }

    static async addToken(address: string, type: string) {
        return await Token.create({
            _id: address,
            tokenType: type,
        });
    }
}
