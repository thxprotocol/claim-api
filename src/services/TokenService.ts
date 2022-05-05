import { Token } from '@/models/Token';
export default class TokenService {
    static async findTokenByAddress(address: string) {
        return Token.findById(address);
    }

    static async addToken(address: string, type: string) {
        return await Token.create({
            _id: address,
            type: type,
        });
    }

    static async getAllTokens() {
        return Token.find({});
    }
}
