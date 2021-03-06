// Copyright 2019 Google, LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import assert from 'assert';
import {describe, it} from 'mocha';
import {request} from '../src/index';
import {PassThrough} from 'stream';
import * as stream from 'stream';
import * as uuid from 'uuid';
const port = 7172; // should match the port defined in `webserver.ts`

function isReadableStream(obj: stream.Readable | string) {
  return obj instanceof stream.Readable && typeof obj._read === 'function';
}

describe('💻 browser tests', () => {
  it('should just work from browser', async () => {
    const result = await request({url: `http://localhost:${port}/path`});
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.data, 'response');
  });

  it('should pass querystring parameters from browser', async () => {
    const result = await request({
      url: `http://localhost:${port}/querystring`,
      params: {query: 'value'},
    });
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.data, 'value');
  });

  it('should support multipart post from the browser', async () => {
    const headers: {[key: string]: string} = {};
    const multipart = [
      {
        'Content-Type': 'application/json',
        body: JSON.stringify({hello: 'world'}),
      },
      {
        'Content-Type': 'text/plain',
        body: 'hello world!',
      },
    ];
    const boundary = uuid.v4();
    const finale = `--${boundary}--`;
    headers['Content-Type'] = `multipart/related; boundary=${boundary}`;

    let content = '';
    for (const part of multipart) {
      const preamble = `--${boundary}\r\nContent-Type: ${part['Content-Type']}\r\n\r\n`;
      // rStream.push(preamble);
      content += preamble;
      if (typeof part.body === 'string') {
        content += part.body;
        content += '\r\n';
      }
    }
    content += finale;
    const result = await request({
      headers,
      data: content,
      method: 'POST',
      url: `http://localhost:${port}/path`,
    });
    assert.strictEqual(result.status, 200);
    const parts = result.data as string[];
    assert.strictEqual(parts[0], '{"hello":"world"}');
    assert.strictEqual(parts[1], 'hello world!');
  });
});
