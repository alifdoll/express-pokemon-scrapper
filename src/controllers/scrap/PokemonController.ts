import Controller from '../Controller';
import { Request, Response, Router } from 'express';

class PokemonController extends Controller {
  private router: Router;

  constructor() {
    super();
    this.router = Router();
    this.routes();
  }

  public getRouter(): Router {
    return this.router;
  }

  public routes(): void {
    this.router.get('/', this.index);
  }

  public async index(req: Request, res: Response): Promise<Response> {
    try {
      const request_body = req.body;
      return super.success(res, 'success', {
        some_val: 'This is testing',
      });
    } catch (error: any) {
      console.error(error.message);
      return super.error(res, 'error', error);
    }
  }
}

export default new PokemonController().getRouter();
