import {IHolder, Holder} from '@/models/Holder';
export default class HolderService {
    static async addHolder(req: any, res?: any){
      console.log('Body', req);
      const holder = await Holder.create({
          address: req.address,
          balance: req.balance,
          stakedAmount: req.stakedAmount,
      });

      res.status(200).json(holder);
    }
}