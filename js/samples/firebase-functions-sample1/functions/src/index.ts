/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { generate } from '@genkit-ai/ai/generate';
import { getLocation, getProjectId } from '@genkit-ai/common';
import { configureGenkit } from '@genkit-ai/common/config';
import { run, runFlow, streamFlow } from '@genkit-ai/flow';
import { firebase } from '@genkit-ai/plugin-firebase';
import { onFlow, noAuth } from '@genkit-ai/plugin-firebase/functions';
import { geminiPro, vertexAI } from '@genkit-ai/plugin-vertex-ai';
import { firebaseAuth } from '@genkit-ai/plugin-firebase/auth';
import { onRequest } from 'firebase-functions/v2/https';
import * as z from 'zod';

configureGenkit({
  plugins: [
    firebase({ projectId: getProjectId() }),
    vertexAI({ location: getLocation(), projectId: getProjectId() }),
  ],
  flowStateStore: 'firebase',
  traceStore: 'firebase',
  enableTracingAndMetrics: true,
  logLevel: 'debug',
});

export const jokeFlow = onFlow(
  {
    name: 'jokeFlow',
    input: z.string(),
    output: z.string(),
    httpsOptions: { invoker: 'private' },
    authPolicy: firebaseAuth((user) => {
      if (!user.email_verified) {
        throw new Error('Email not verified');
      }
    }),
  },
  async (subject) => {
    const prompt = `Tell me a joke about ${subject}`;

    return await run('call-llm', async () => {
      const llmResponse = await generate({
        model: geminiPro,
        prompt: prompt,
      });

      return llmResponse.text();
    });
  }
);

export const authFlow = onFlow(
  {
    name: 'authFlow',
    input: z.string(),
    output: z.string(),
    authPolicy: firebaseAuth((user) => {
      if (!user.email_verified) {
        throw new Error('Email not verified');
      }
    }),
  },
  async (input) => input.toUpperCase()
);

export const streamer = onFlow(
  {
    name: 'streamer',
    input: z.number(),
    output: z.string(),
    streamType: z.object({ count: z.number() }),
    authPolicy: noAuth(),
  },
  async (count, streamingCallback) => {
    console.log('streamingCallback', !!streamingCallback);
    var i = 0;
    if (streamingCallback) {
      for (; i < count; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        streamingCallback({ count: i });
      }
    }
    return `done: ${count}, streamed: ${i} times`;
  }
);

export const streamConsumer = onFlow(
  {
    name: 'streamConsumer',
    input: z.void(),
    output: z.void(),
    authPolicy: noAuth(),
  },
  async () => {
    const response = streamFlow(streamer, 5);

    for await (const chunk of response.stream()) {
      console.log('chunk', chunk);
    }

    console.log('streamConsumer done', await response.operation());
  }
);

export const triggerJokeFlow = onRequest(
  { invoker: 'private' },
  async (req, res) => {
    const { subject } = req.query;
    console.log('req.query', req.query);
    const op = await runFlow(jokeFlow, String(subject));
    console.log('operation', op);
    res.send(op);
  }
);