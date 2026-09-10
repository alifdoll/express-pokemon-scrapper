import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'my-app',
});

const test = inngest.createFunction({ id: 'my-app', triggers: [{ event: 'test-job' }] }, async ({ event, step }) => {
  //   await step.sleep('wait-a-moment', '1s');

  console.log('HELO HELO THIS IS BG INNGEST JOBS');

  return { message: `Hello This is test job!` };
});

export const functions = [test];
