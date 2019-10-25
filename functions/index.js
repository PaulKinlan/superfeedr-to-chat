/*
 * Copyright 2018 Google Inc.
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

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.post('/', async (req, res) => {
  const { webhook_url } = req.query;
  const { body } = req;
  
  console.log(body);

  if (body.items === undefined || body.items.length === 0) {
    res.send('');
    return;
  }

  for(let item of body.items) {
    const actor = (item.actor && item.actor.displayName) ? item.actor.displayName : body.title;
    const content = item.content || body.content;

    if (content !== undefined && content.length < 500) { 
      console.warn('Not much content', content);
      continue;
    }

    try {
      await fetch(webhook_url, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          "text": `*${actor}* published <${item.permalinkUrl}|${item.title}>. Please consider <https://twitter.com/intent/tweet?url=${encodeURIComponent(body.items[0].permalinkUrl)}&text=${encodeURIComponent(body.items[0].title)}|Sharing it>.`
        })
      });
    } catch (ex) {
      // If there is an error, just kill it all.
      return res.send('error', ex)
    }
  }

  return res.send('ok');
})
// Expose Express API as a single Cloud Function:
exports.publish = functions.https.onRequest(app);
