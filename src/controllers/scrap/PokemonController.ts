import axios from 'axios';
import Controller from '../Controller';
import { Request, Response, Router } from 'express';
import { load } from 'cheerio';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { PrismaClient } from '@prisma/client/default';

interface Pokemon {
  name: string;
  evolution: string;
  hp: number;
  type: string;
  regulation: string;
  collector_code: string;
  image?: string;
}
class PokemonController extends Controller {
  private router: Router;
  private prisma: PrismaClient;

  constructor() {
    super();
    this.router = Router();
    this.routes();

    this.prisma = new PrismaClient();
  }

  public getRouter(): Router {
    return this.router;
  }

  public routes(): void {
    this.router.get('/', this.index.bind(this));
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

        const response_detail = await axios.get(pokemon_detail_url);
        const html_detail_data = response_detail.data;
        const cheerio_detail = load(html_detail_data);
        const pokemon_evo_stage = cheerio_detail('.evolveMarker').text().trim();

        cheerio_detail('.evolveMarker').remove();

        const pokemon_name = cheerio_detail('.cardDetail').text().trim();
        const data = cheerio_detail('.cardInformationColumn');

        const pokemon_hp = data.find('.number').text();

        const regulation_code = cheerio_detail('.alpha').text().trim();
        const collector_code = cheerio_detail('.collectorNumber').text().trim();

        // Jika ada di database, continue
        // Jika tidak ada lanjut, dan save

        if (this.checkExists(collector_code)) continue;

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
          case 'https://asia.pokemon-card.com/various_images/energy/Psychic.png':
            // statement N
            pokemon_type = 'psychic';
            break;
          case 'https://asia.pokemon-card.com/various_images/energy/Water.png':
            // statement N
            pokemon_type = 'water';
            break;
          case 'https://asia.pokemon-card.com/various_images/energy/Lightning.png':
            // statement N
            pokemon_type = 'lighting';
            break;
          case 'https://asia.pokemon-card.com/various_images/energy/Fighting.png':
            // statement N
            pokemon_type = 'fighting';
            break;
          case 'https://asia.pokemon-card.com/various_images/energy/Darkness.png':
            // statement N
            pokemon_type = 'dark';
            break;
          case 'https://asia.pokemon-card.com/various_images/energy/Metal.png':
            // statement N
            pokemon_type = 'metal';
            break;
          default:
            pokemon_type = '';
            break;
        }

        const card_image = cheerio_detail('.cardImage').find('img').attr('src');

        await this.saveImage(card_image);

        const pokemon_data: Pokemon = {
          name: pokemon_name,
          evolution: pokemon_evo_stage,
          hp: +pokemon_hp,
          type: pokemon_type,
          regulation: regulation_code,
          collector_code: collector_code,
          image: card_image,
        };

        result.push(pokemon_data);
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

  private async checkExists(card_code: string): Promise<Boolean> {
    console.log('HELOO THIS IS TEST');

    const card = await this.prisma.card.findFirst({
      where: {
        expansion_code: card_code,
      },
    });
    console.log('🚀 ~ PokemonController ~ checkExists ~ card:', card);

    return card != null ? true : false;
  }

  private async saveImage(url: string) {
    console.log('🚀 ~ PokemonController ~ saveImage ~ url:', url);

    let uploadDir = 'public/storage';

    uploadDir = path.join(__dirname, '../../', uploadDir);
    console.log('🚀 ~ PokemonController ~ saveImage ~ uploadDir:', uploadDir);

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Extract extension or fallback to .png
    const urlWithoutQuery = url.split('?')[0];
    const ext = path.extname(urlWithoutQuery) || '.png';

    // Generate unique filename
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadDir, fileName);
    console.log('🚀 ~ PokemonController ~ saveImage ~ filePath:', filePath);

    // Fetch image as stream
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
    });

    // Write stream to file
    await pipeline(response.data, fs.createWriteStream(filePath));

    return `/storage/${fileName}`;
  }
}

export default new PokemonController().getRouter();
