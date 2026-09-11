import axios from 'axios';
import Controller from '../Controller';
import { Request, Response, Router } from 'express';
import { load } from 'cheerio';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { CardType, EvolutionType, PokemonType, PrismaClient } from '@prisma/client';
import { randomInt } from 'crypto';
import { inngest } from '../../jobs/PokemonJobs';
import { prisma } from '../../helpers/Prisma';

interface Pokemon {
  name: string;
  evolution: string;
  hp: number;
  type: string;
  regulation: string;
  collector_code: string;
  image?: string;
  images?: object[];
}
class PokemonController extends Controller {
  private router: Router;
  private prisma: PrismaClient;
  constructor() {
    super();
    this.router = Router();
    this.routes();

    this.prisma = prisma;
  }

  public getRouter(): Router {
    return this.router;
  }

  public routes(): void {
    this.router.get('/', this.index.bind(this));
    this.router.get('/codes', this.getExpansionCode.bind(this));
    this.router.get('/cards', this.getPokemonCards.bind(this));
  }

  public async index(req: Request, res: Response): Promise<Response> {
    try {
      const request_body = req.body;

      const cards = await this.prisma.card.findFirst({
        include: {
          images: true,
        },
      });

      return super.success(res, 'success', {
        content: cards,
      });
    } catch (error: any) {
      console.error(error.message);
      return super.error(res, 'error', error);
    }
  }

  public async getExpansionCode(req: Request, res: Response): Promise<Response> {
    try {
      await inngest.send({
        name: 'scrap-code',
      });

      const result = await this.prisma.expansionCode.findMany();

      return super.success(res, 'success', {
        result,
      });
    } catch (error: any) {
      console.error(error.message);
      return super.error(res, 'error', error);
    }
  }

  public async getPokemonCards(req: Request, res: Response): Promise<Response> {
    try {
      await inngest.send({
        name: 'scrap-card',
      });

      const cards = await this.prisma.card.findMany({
        take: 10,
        include: {
          images: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return super.success(res, 'success', {
        cards,
      });
    } catch (error: any) {
      console.error(error.message);
      return super.error(res, 'error', error);
    }
  }
  // ======================================
}

export default new PokemonController().getRouter();
