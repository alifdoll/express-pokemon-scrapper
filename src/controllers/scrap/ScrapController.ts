import Controller from '../Controller';
import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prismaHelper } from '@base/helpers/PrismaHelpers';
import { inngestPokemon } from '../../jobs/PokemonJobs';

class ScrapController extends Controller {
  private router: Router;
  //   private prisma: PrismaClient;

  constructor() {
    super();
    this.router = Router();

    this.routes();
  }

  public getRouter(): Router {
    return this.router;
  }

  public routes(): void {
    this.router.get('/codes', this.scrapExpansionCodes);
    this.router.get('/cards', this.scrapCards);
  }

  public async scrapExpansionCodes(req: Request, res: Response): Promise<Response> {
    await inngestPokemon.send({
      name: 'scrap-code',
    });
    return super.success(res, 'Scrapping Expansion Codes');
  }

  public async scrapCards(req: Request, res: Response): Promise<Response> {
    await inngestPokemon.send({
      name: 'scrap-card',
    });

    return super.success(res, 'Scrapping Cards');
  }
}

export default new ScrapController().getRouter();
