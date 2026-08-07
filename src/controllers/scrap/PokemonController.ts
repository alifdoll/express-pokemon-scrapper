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

      // const url = 'https://www.octaveclothing.com/men';

      const base_url = 'https://asia.pokemon-card.com';
      const url = base_url + '/id/card-search/list/?pageNo=1&expansionCodes=MA5';
      const result: Record<string, string>[] = [];

      const response = await axios.get(url);
      const html_data = response.data;

      const cheerio = load(html_data);
      // const $ = load(
      //   `<ul>
      //     <li>Item 1</li>
      //     <li>Item 2</li>
      //     <li>Item 3</li>
      //     <li>Jangkrek</li>
      //   </ul>`,
      // );

      // const $ = load(
      //   `<div class="cards">

      //     <div class="card-item">
      //       <p>Text 1</p>
      //     </div>

      //     <div class="card-item">
      //       <p>Text 2</p>
      //     </div>

      //     <div class="card-item">
      //       <p>Text 3</p>
      //     </div>

      //     <div class="card-item">
      //       <p>Card 4</p>
      //     </div>

      //   </div>`,
      // );

      // console.log($.html());

      const listItems = cheerio('.card');

      for (const selectedItem of listItems.toArray()) {
        const item = cheerio(selectedItem);
        const pokemon_detail_href = item.find('a').attr('href');
        if (pokemon_detail_href === undefined) continue;
        const pokemon_detail_url = base_url + pokemon_detail_href;
        console.log('🚀 ~ PokemonController ~ index ~ pokemon_detail_href:', pokemon_detail_url);

        const response_detail = await axios.get(pokemon_detail_url);
        const html_detail_data = response_detail.data;
        const cheerio_detail = load(html_detail_data);
        cheerio_detail('.evolveMarker').remove();
        const pokemon_name = cheerio_detail('.cardDetail').text().trim();
        console.log('🚀 ~ PokemonController ~ index ~ pokemon_name:', pokemon_name);
      }

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
