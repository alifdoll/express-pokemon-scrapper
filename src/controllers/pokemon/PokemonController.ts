import axios from 'axios';
import Controller from '../Controller';
import { Request, Response, Router } from 'express';
import { load } from 'cheerio';
import path from 'path';
import fs from 'fs';
import { CardType, EvolutionType, PokemonType, Prisma, PrismaClient } from '@prisma/client';
import { prismaHelper } from '@base/helpers/PrismaHelpers';
import { parseBoolean } from '../../helpers/HelperFunction';

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

    this.prisma = prismaHelper;
  }

  public getRouter(): Router {
    return this.router;
  }

  public routes(): void {
    this.router.get('/cards', this.getCards.bind(this));
    this.router.get('/codes', this.getExpansionCode.bind(this));
  }

  public async getExpansionCode(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.prisma.expansionCode.findMany();

      return super.success(res, 'success', {
        result,
      });
    } catch (error: any) {
      console.error(error.message);
      return super.error(res, 'error', error);
    }
  }

  public async getCards(req: Request, res: Response): Promise<Response> {
    try {
      const body = req.body;
      const params = req.query;
      console.log('🚀 ~ PokemonController ~ getCards ~ params:', params.healt);

      const cards = await this.prisma.card.findMany({
        where: {
          regulation_code: {
            contains: params.regulation_code ? String(params.regulation_code) : undefined,
            mode: 'insensitive',
          },
          name: {
            contains: params.name ? String(params.name) : undefined,
            mode: 'insensitive',
          },
          pokemon_type: params.pokemon_type ? (String(params.pokemon_type).toUpperCase() as PokemonType) : undefined,
          health_point: params.health_point ? parseInt(params.health_point as string) : undefined,
          // has_ability: params.has_ability ? parseBoolean(params.has_ability) : undefined,
          card_type: params.card_type ? (String(params.card_type).toUpperCase() as CardType) : undefined,
        },
        take: 10,
        include: {
          images: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      const count = cards.length;
      return super.success(res, 'success', {
        count,
        cards,
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientValidationError) {
        return super.notFound(res, 'Data Not Found', []);
      }

      console.error(error.message);
      return super.error(res, 'error', error);
    }
  }
}

export default new PokemonController().getRouter();
