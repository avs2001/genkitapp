/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {devLocalVectorstore, devLocalRetrieverRef, devLocalIndexerRef} from '@genkit-ai/dev-local-vectorstore';
import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { genkit, z ,Document} from 'genkit';
import fs from 'fs/promises'

const ai = genkit({
  plugins: [
    googleAI(),
    devLocalVectorstore([
      {
        indexName: 'documentation',
        embedder: googleAI.embedder('gemini-embedding-001'),
      },
    ])
  ],
  model: gemini20Flash
});
// Define the retriever reference
export const retriever = devLocalRetrieverRef('documentation');
// Reference to a local vector database storing Genkit documentation
const indexer = devLocalIndexerRef('documentation');



// Function to load and embed documentation
async function loadAndEmbedDocumentation() {
  try {
    const documentationContent = await fs.readFile('documentation/library-documentation.txt', 'utf-8');
    const documentChunks = documentationContent.split('-----------------------------------------------------------');

    const documents = documentChunks.map(chunk => {
      return Document.fromText(chunk);
    });
  

    await ai.index({
      indexer: indexer,
      documents:documents.splice(15,17)
    });


    
  } catch (error) {
    console.error('Error loading or embedding documentation:', error);
  }
}

(async () => {
  // Embed documentation when the application starts
  await loadAndEmbedDocumentation();
  const question = 'I want an example how to use accordion.';

  // Consistent API to retrieve most relevant documents based on semantic similarity to query
  const docs = await ai.retrieve({
    retriever: retriever,
    query: question,
  });

  const result = await ai.generate({
    prompt: `Use the provided context from the Genkit documentation to answer this query: ${question}`,
    docs, // Pass retrieved documents to the model
  });

  console.log(result.text);
})();
