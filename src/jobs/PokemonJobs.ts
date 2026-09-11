import { PrismaClient } from '@prisma/client';
import { Inngest } from 'inngest';
import { PokemonScrapService } from '../services/PokemonScrapService';

const prisma = new PrismaClient();

export const inngest = new Inngest({
  id: 'my-app',
});

const test = inngest.createFunction({ id: 'my-app', triggers: [{ event: 'test-job' }] }, async ({ event, step }) => {
  //   await step.sleep('wait-a-moment', '1s');

  console.log('HELO HELO THIS IS BG INNGEST JOBS');

  return { message: `Hello This is test job!` };
});

const scrap_expansion_codes = inngest.createFunction({ id: 'poke-scrap', triggers: [{ event: 'scrap-code' }] }, async ({ event, step }) => {
  await PokemonScrapService.scrapExpansionCode();

  return { message: 'scrapping expansion codes' };
});

const scrap_cards = inngest.createFunction({ id: 'poke-card-scrap', triggers: [{ event: 'scrap-card' }] }, async ({ event, step }) => {
  await PokemonScrapService.scrapCards(step);
  return { message: 'Scrapping Cards' };
});

export const functions = [test, scrap_expansion_codes, scrap_cards];
