import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { pipeline } from 'stream/promises';
import { load } from 'cheerio';
import { prisma as prismaClient } from '../helpers/Prisma';
import { CardType, EvolutionType, PokemonType } from '@prisma/client';

// const base_url = 'https://asia.pokemon-card.com/id/';
const base_url = 'https://asia.pokemon-card.com';
const prisma = prismaClient;

const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

const saveImage = async (url: string) => {
  let uploadDir = 'public/storage/images';

  uploadDir = path.join(__dirname, '../', uploadDir);

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const urlWithoutQuery = url.split('?')[0];
  const ext = path.extname(urlWithoutQuery) || '.png';

  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  const response = await axios({
    url: url,
    method: 'GET',
    responseType: 'stream',
  });

  await pipeline(response.data, fs.createWriteStream(filePath));

  return `/storage/images/${fileName}`;
};

const scrapExpansionCode = async () => {
  let code_base_url = base_url + '/id/card-search';
  let page_number = 1;
  let number_scrapped = 0;

  console.log('🚀 ~ Scrapping Expansion Code ~ ');

  while (true) {
    let url = code_base_url + `?pageNo=${page_number}`;
    page_number++;

    const response = await axios.get(url);
    const html_data = response.data;

    const cheerio = load(html_data);

    const listItems = cheerio('.expansionList li').toArray();
    if (listItems.length == 0) break;

    const expansion_code_urls = cheerio('.expansionLink');

    for (const urls of expansion_code_urls.toArray()) {
      let data = cheerio(urls);
      let release_date = data.find('.relaseDate').text().trim();

      let expansion_code_url = data.attr('href');
      const expansion_code = expansion_code_url.match(/expansionCodes=([^?&]+)/)?.[1];
      console.log('🚀 ~ scrapExpansionCode ~ expansion_code:', expansion_code);

      const check = await prisma.expansionCode.findFirst({
        where: {
          code: expansion_code,
        },
      });

      if (check != null) continue;

      await prisma.expansionCode.create({
        data: {
          code: expansion_code,
          release_date: new Date(release_date),
        },
      });

      number_scrapped++;
    }
  }
};

const scrapCards = async (step: any) => {
  try {
    const expansion_codes = await prisma.expansionCode.findMany({
      where: {
        scrapped: false,
      },
    });

    console.log('🎴 ~ Scrapping Pokemon Cards ~');

    for (const code of expansion_codes) {
      let page_number = 1;
      let expansion_code = code.code;
      console.log('🃏 ~ Scrapping Cards , Expansion Code :', expansion_code);

      while (true) {
        let url = base_url + `/id/card-search/list/?pageNo=${page_number}&expansionCodes=${expansion_code}`;
        console.log('🃏 ~ scrapCards ~ page_number:', page_number);

        page_number++;

        const response = await axios.get(url);

        const html_data = response.data;

        const cheerio = load(html_data);

        const delayMs = Math.floor(Math.random() * (4000 - 3000 + 1)) + 3000;
        console.log(`Wait for ${delayMs}ms.....`);
        await delay(delayMs);

        const not_found = cheerio('.noResult');

        if (not_found.html() != null) {
          console.log('KOK BREAK');

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

          const pokemon_type = checkPokemonType(cheerio_detail);
          const card_type = cheerio_detail('.commonHeader').text().trim();

          if (card_type != 'Item' && card_type != 'Pokémon Tool' && card_type != 'Supporter' && card_type != 'Stadium') {
            if (pokemon_type == '') {
              saveEnergy(cheerio_detail);
            } else {
              // Save Pokemon
              savePokemon(cheerio_detail);
            }
          } else {
            saveSupporter(cheerio_detail);
          }
        }
      }

      console.log('CODE SCRAPPED!!');

      await prisma.expansionCode.update({
        where: {
          id: code.id,
        },
        data: {
          scrapped: true,
        },
      });

      // break;
    }
  } catch (error: any) {
    console.error(error.message);
  }
};

const checkPokemonType = (cheerio_detail: any) => {
  const data = cheerio_detail('.cardInformationColumn');
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
    case 'https://asia.pokemon-card.com/various_images/energy/Dragon.png':
      // statement N
      pokemon_type = 'dragon';
      break;
    default:
      pokemon_type = '';
      break;
  }

  if (pokemon_type == 'LAINNYA') {
    pokemon_type = PokemonType.OTHER;
  }
  return pokemon_type;
};

const checkExists = async (card_code: string) => {
  const card = await prisma.card.findFirst({
    where: {
      expansion_code: card_code,
    },
  });

  return card != null ? true : false;
};

const savePokemon = async (cheerio_detail: any) => {
  let pokemon_evo_stage = cheerio_detail('.evolveMarker').text().trim().toUpperCase().replace(/\s+/g, '_');
  pokemon_evo_stage = pokemon_evo_stage == 'LAINNYA' ? EvolutionType.OTHER : pokemon_evo_stage;

  cheerio_detail('.evolveMarker').remove();

  const pokemon_name = cheerio_detail('.cardDetail').text().trim();
  const data = cheerio_detail('.cardInformationColumn');

  const pokemon_hp = data.find('.number').text();

  const regulation_code = cheerio_detail('.alpha').text().trim();
  const collector_code = cheerio_detail('.collectorNumber').text().trim();

  // Jika ada di database, continue
  // Jika tidak ada lanjut, dan save

  const card_exists = await checkExists(collector_code);
  if (card_exists) return;

  const pokemon_type = checkPokemonType(cheerio_detail);

  // Kartu Energi!
  if (+pokemon_hp == 0 && pokemon_type == '') return;

  const card_image = cheerio_detail('.cardImage').find('img').attr('src');

  console.log('🚀 ~ Saving Pokemon Card!!');
  const card = await prisma.card.create({
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
  const image_path = await saveImage(card_image);

  // Save the path
  await prisma.cardImage.create({
    data: {
      card_id: card.id,
      image: image_path,
    },
  });
};

const saveSupporter = async (cheerio_detail: any) => {
  const card_image = cheerio_detail('.cardImage').find('img').attr('src');
  const supporter_name = cheerio_detail('.cardDetail').text().trim();

  const regulation_code = cheerio_detail('.alpha').text().trim();
  const collector_code = cheerio_detail('.collectorNumber').text().trim();
  const description = cheerio_detail('.skillEffect').text().trim();
  let card_type = cheerio_detail('.commonHeader').text().trim().toUpperCase().replace(/\s+/g, '_');
  if (card_type == 'POKÉMON_TOOL') {
    card_type = 'POKEMON_TOOL';
  }

  const card_exists = await checkExists(collector_code);
  if (card_exists) return;

  console.log('🚀 ~ Saving Trainer Card!!');

  const card = await prisma.card.create({
    data: {
      name: supporter_name,
      regulation_code: regulation_code,
      expansion_code: collector_code,
      description: description,
      card_type: card_type as CardType,
    },
  });

  // Save image to storage
  const image_path = await saveImage(card_image);

  // Save the path
  await prisma.cardImage.create({
    data: {
      card_id: card.id,
      image: image_path,
    },
  });
};

const saveEnergy = async (cheerio_detail: any) => {
  const card_image = cheerio_detail('.cardImage').find('img').attr('src');
  const card_name = cheerio_detail('.cardDetail').text().trim();

  const regulation_code = cheerio_detail('.alpha').text().trim();
  const collector_code = cheerio_detail('.collectorNumber').text().trim();
  const description = cheerio_detail('.skillEffect').text().trim();
  const card_type = CardType.ENERGY;

  const card_exists = await checkExists(collector_code);
  if (card_exists) return;

  const card = await prisma.card.create({
    data: {
      name: card_name,
      regulation_code: regulation_code,
      expansion_code: collector_code,
      description: description,
      card_type: card_type,
    },
  });

  // Save image to storage
  const image_path = await saveImage(card_image);

  // Save the path
  await prisma.cardImage.create({
    data: {
      card_id: card.id,
      image: image_path,
    },
  });

  console.log('🚀 ~ Saving Energy Card!!');
};

function randomSleep(minMs: number = 3000, maxMs: number = 4000): Promise<void> {
  console.log('🚀 ~ Waiting');
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export const PokemonScrapService = {
  saveImage,
  scrapExpansionCode,
  scrapCards,
};
