import { PrismaClient } from '@prisma/client';
import { Inngest } from 'inngest';
import { PokemonScrapService } from '../services/PokemonScrapService';

export const inngestPokemon = new Inngest({
  id: 'my-app',
});

const scrap_expansion_codes = inngestPokemon.createFunction({ id: 'poke-scrap', triggers: [{ event: 'scrap-code' }] }, async ({ event, step }) => {
  await PokemonScrapService.scrapExpansionCode();

  return { message: 'scrapping expansion codes' };
});

const scrap_cards = inngestPokemon.createFunction({ id: 'poke-card-scrap', triggers: [{ event: 'scrap-card' }] }, async ({ event, step }) => {
  await PokemonScrapService.scrapCards(step);
  return { message: 'Scrapping Cards' };
});

export const functions = [scrap_expansion_codes, scrap_cards];
