import axios from 'axios';
import Controller from '../Controller';
import { Request, Response, Router } from 'express';
import { load } from 'cheerio';

interface Pokemon {
  name: string;
  evolution: string;
  hp: number;
  type: string;
  regulation: string;
  collector_code: string;
}
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
      // const result: Record<string, string>[] = [];
      const result: Pokemon[] = [];

      const response = await axios.get(url);
      const html_data = response.data;

      const cheerio = load(html_data);

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
        const pokemon_evo_stage = cheerio_detail('.evolveMarker').text().trim();

        cheerio_detail('.evolveMarker').remove();

        const pokemon_name = cheerio_detail('.cardDetail').text().trim();
        const data = cheerio_detail('.cardInformationColumn');

        const pokemon_hp = data.find('.number').text();
        console.log('🚀 ~ PokemonController ~ index ~ data:', cheerio_detail('.alpha').html());

        const regulation_code = cheerio_detail('.alpha').text().trim();
        const collector_code = cheerio_detail('.collectorNumber').text().trim();

        const pokemon_type_url = data.find('.mainInfomation').find('img').attr('src');
        let pokemon_type = '';

        switch (pokemon_type_url) {
          case 'https://asia.pokemon-card.com/various_images/energy/Grass.png':
            // statement 1
            pokemon_type = 'grass';
            break;
          case 'https://asia.pokemon-card.com/various_images/energy/Fire.png':
            // statement 2
            pokemon_type = 'fire';
            break;
          case 'https://asia.pokemon-card.com/various_images/energy/Colorless.png':
            // statement N
            pokemon_type = 'colorless';
            break;
          default:
            pokemon_type = '';
            break;
        }

        const pokemon_data: Pokemon = {
          name: pokemon_name,
          evolution: pokemon_evo_stage,
          hp: +pokemon_hp,
          type: pokemon_type,
          regulation: regulation_code,
          collector_code: collector_code,
        };

        result.push(pokemon_data);

        console.log('🚀 ~ PokemonController ~ index ~ pokemon_data:', pokemon_data);
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
