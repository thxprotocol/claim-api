import { Request, Response } from 'express';
import HolderService from '../../services/HolderService'

export const CreateHolderController = async (req: Request, res: Response) => {
  await HolderService.addHolder(req.body, res)
  console.log("Add holder", req.body)
} 