import axios from 'axios';
import Controller from '../Controller';
import { Request, Response, Router } from 'express';
import { load } from 'cheerio';

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
      console.log('🚀 ~ PokemonController ~ index ~ html_data:');

      const url = 'https://www.octaveclothing.com/men';
      const result: Record<string, string>[] = [];

      const response = await axios.get(url);
      // const html_data = response.data;
      // // console.info("🚀 ~ PokemonController ~ index ~ const:", const)

      const $ = load(html_data);

      // const keys = ['Title', 'Description', 'Price'];
      // const selectedElem = '.views-infinite-scroll-content-wrapper > .row > .col-6 > .product-7 > .product-body';

      // $(selectedElem).each((parentIndex, parentElem) => {
      //   let keyIndex = 0;
      //   const data: Record<string, string> = {};

      //   if (parentIndex) {
      //     $(parentElem)
      //       .children()
      //       .each((_childId, childElem) => {
      //         const value = $(childElem).text().trim();
      //         if (value && keys[keyIndex]) {
      //           data[keys[keyIndex]] = value;
      //           keyIndex++;
      //         }
      //       });
      //     result.push(data);
      //   }
      // });

      return super.success(res, 'success', {
        some_val: 'This is testing',
        content: result,
      });
    } catch (error: any) {
      console.error(error.message);
      return super.error(res, 'error', error);
    }
  }
}

export default new PokemonController().getRouter();
