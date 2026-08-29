import axios from 'axios';
import Controller from '../Controller';
import { Request, Response, Router } from 'express';
import { load } from 'cheerio';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { CardType, EvolutionType, PokemonType, PrismaClient } from '@prisma/client';
import { randomInt } from 'crypto';

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
      // TODO ERROR, alternate art sudah ke save, tapi ke save lagi ketika akses scrap
      // pokemon chespin ada 2 art, 2 art sudah ke save, ketika akses lagi duplicate, ada 3 data di db, dan folder juga ada 3, 1 ganbar dab 2 gambar sama!
      const request_body = req.body;
      // const test = await this.prisma.card.findMany({
      //   where: {
      //     regulation_code: 'J',
      //   },
      //   include: {
      //     images: true,
      //   },
      // });

      // return super.success(res, 'success', {
      //   some_val: 'This is testing',
      //   content: test,
      // });

      const base_url = 'https://asia.pokemon-card.com';
      let page_number = 1;

      const result: Pokemon[] = [];
      // const result = await this.prisma.card.findMany({
      //   include: {
      //     images: true,
      //   },
      // });

      while (true) {
        let url = base_url + `/id/card-search/list/?pageNo=${page_number}&expansionCodes=MA5`;
        console.log('🚀 ~ PokemonController ~ Scrapping Page Number:', page_number);
        page_number++;

        const response = await axios.get(url);
        const html_data = response.data;

        const cheerio = load(html_data);

        const not_found = cheerio('.noResult');
        // console.log('🚀 ~ PokemonController ~ index ~ not_found:', not_found.html());
        if (not_found.html() != null) {
          console.log('BREaK');

          break;
        }
        const listItems = cheerio('.card');

        for (const selectedItem of listItems.toArray()) {
          const item = cheerio(selectedItem);

          const pokemon_detail_href = item.find('a').attr('href');
          if (pokemon_detail_href === undefined) continue;
          const pokemon_detail_url = base_url + pokemon_detail_href;

          const response_detail = await axios.get(pokemon_detail_url);
          const html_detail_data = response_detail.data;
          const cheerio_detail = load(html_detail_data);

          const card_type = cheerio_detail('.commonHeader').text().trim();
          if (card_type != 'Item' && card_type != 'Pokémon Tool' && card_type != 'Supporter' && card_type != 'Stadium') {
            // Save Pokemon
            this.savePokemon(cheerio_detail);
          } else {
            this.saveSupporter(cheerio_detail);
          }

          // console.log('🚀 ~ PokemonController ~ index ~ card_type:', card_type);

          // result.push(pokemon_data);
        }
      }

      const cards = await this.prisma.card.findMany({
        include: {
          images: true,
        },
      });

      return super.success(res, 'success', {
        some_val: 'This is testing',
        content: cards,
      });
    } catch (error: any) {
      console.error(error.message);
      return super.error(res, 'error', error);
    }
  }

  private async checkExists(card_code: string): Promise<Boolean> {
    const card = await this.prisma.card.findFirst({
      where: {
        expansion_code: card_code,
      },
    });

    return card != null ? true : false;
  }

  private async saveImage(url: string) {
    let uploadDir = 'public/storage';

    uploadDir = path.join(__dirname, '../../', uploadDir);

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Extract extension or fallback to .png
    const urlWithoutQuery = url.split('?')[0];
    const ext = path.extname(urlWithoutQuery) || '.png';

    // Generate unique filename
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

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

  // return true if a new data is an alternate image (same card different art, provided if the existing data is already saved)
  // eg kartu dengan art ur sudah ada, dan ada data kartu sama dengan art biasa (bukan ur/ar), maka true
  // eg kartu dengan art biasa sudah tersimpan, dan ada data baru dengan art lain, maka true
  // eg ada data dengan kartu ur, belum ada data kartu tersimpan, maka false
  private async isAlternate(collector_code: string, regulation_code: string, name: string) {
    const card = await this.prisma.card.findFirst({
      where: {
        AND: [
          {
            regulation_code: {
              contains: regulation_code,
              mode: 'insensitive',
            },
          },
        ],
        OR: [
          {
            expansion_code: {
              contains: collector_code,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: name,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    return card != null ? true : false;
  }

  private async savePokemon(cheerio_detail: any) {
    const pokemon_evo_stage = cheerio_detail('.evolveMarker').text().trim().toUpperCase().replace(/\s+/g, '_');

    cheerio_detail('.evolveMarker').remove();

    const pokemon_name = cheerio_detail('.cardDetail').text().trim();
    const data = cheerio_detail('.cardInformationColumn');

    const pokemon_hp = data.find('.number').text();

    const regulation_code = cheerio_detail('.alpha').text().trim();
    const collector_code = cheerio_detail('.collectorNumber').text().trim();

    // Jika ada di database, continue
    // Jika tidak ada lanjut, dan save

    const card_exists = await this.checkExists(collector_code);
    if (card_exists) return;

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
        pokemon_type = 'darkness';
        break;
      case 'https://asia.pokemon-card.com/various_images/energy/Metal.png':
        // statement N
        pokemon_type = 'metal';
        break;
      default:
        pokemon_type = '';
        break;
    }

    // Kartu Energi!
    if (+pokemon_hp == 0 && pokemon_type == '') return;

    const card_image = cheerio_detail('.cardImage').find('img').attr('src');

    const card = await this.prisma.card.create({
      data: {
        name: pokemon_name,
        evo_type: pokemon_evo_stage as EvolutionType,
        health_point: +pokemon_hp,
        pokemon_type: pokemon_type.toUpperCase() as PokemonType,
        regulation_code: regulation_code,
        expansion_code: collector_code,
        card_type: CardType.POKEMON,
      },
    });

    // Save image to storage
    const image_path = await this.saveImage(card_image);

    // Save the path
    await this.prisma.cardImage.create({
      data: {
        card_id: card.id,
        image: image_path,
      },
    });
  }

  private async saveSupporter(cheerio_detail: any) {
    const card_image = cheerio_detail('.cardImage').find('img').attr('src');
    const supporter_name = cheerio_detail('.cardDetail').text().trim();

    const regulation_code = cheerio_detail('.alpha').text().trim();
    const collector_code = cheerio_detail('.collectorNumber').text().trim();
    const description = cheerio_detail('.skillEffect').text().trim();
    const card_type = cheerio_detail('.commonHeader').text().trim().toUpperCase();

    const card = await this.prisma.card.create({
      data: {
        name: supporter_name,
        regulation_code: regulation_code,
        expansion_code: collector_code,
        description: description,
        card_type: card_type as CardType,
      },
    });

    // Save image to storage
    const image_path = await this.saveImage(card_image);

    // Save the path
    await this.prisma.cardImage.create({
      data: {
        card_id: card.id,
        image: image_path,
      },
    });
  }
}

export default new PokemonController().getRouter();
