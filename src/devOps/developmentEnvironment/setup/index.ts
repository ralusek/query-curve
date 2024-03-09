import fs from 'fs';
import path from 'path';
import { exec as execCB } from 'child_process';
import util from 'util';
import indigobird from 'indigobird';
import _ from 'lodash';

import { dir } from 'index';

// Utils
import asEnum from 'utils/asEnum';

const REPO_ROOT = path.join(dir, '../repositories');

const REPO_NAME = asEnum({
  QUERY_CURVE_COMMON: 'common',

  QUERY_CURVE_BUILDER: 'builder',
  QUERY_CURVE_QUERY: 'query',
});

const REPO_NAME_LIST = Object.values(REPO_NAME);

const REPO_PATH = {
  [REPO_NAME.QUERY_CURVE_COMMON]: path.join(REPO_ROOT, REPO_NAME.QUERY_CURVE_COMMON),

  [REPO_NAME.QUERY_CURVE_BUILDER]: path.join(REPO_ROOT, REPO_NAME.QUERY_CURVE_BUILDER),
  [REPO_NAME.QUERY_CURVE_QUERY]: path.join(REPO_ROOT, REPO_NAME.QUERY_CURVE_QUERY),
};

const SYMLINK_MAP = {
  [REPO_NAME.QUERY_CURVE_BUILDER]: [
    {
      FROM: path.join(REPO_PATH[REPO_NAME.QUERY_CURVE_COMMON], 'src'),
      TO: 'src/@common'
    },
  ],
  [REPO_NAME.QUERY_CURVE_QUERY]: [
    {
      FROM: path.join(REPO_PATH[REPO_NAME.QUERY_CURVE_COMMON], 'src'),
      TO: 'src/@common'
    },
  ],
};

const exec = util.promisify(execCB);

setup();


export default async function setup() {
  // Create repositories directory. Swallow error if dir already exists.
  await fs.promises.mkdir(REPO_ROOT).catch(err => {});


  // Create necessary symlinks
  console.log('Establishing any necessary symlinks...');
  await indigobird.map(REPO_NAME_LIST, async (repoName) => {
    const symlinkMaps: typeof SYMLINK_MAP[keyof typeof SYMLINK_MAP] | undefined = _.get(SYMLINK_MAP, repoName);
    if (!symlinkMaps) return;

    return indigobird.map(symlinkMaps, async (symlinkMap) => {
      const from = symlinkMap.FROM;
      const to = path.join(REPO_PATH[repoName], symlinkMap.TO);
      // Create symlink, swallow error if it already exists
      await fs.promises.symlink(from, to).catch(err => {
        if (!err.message.includes('file already exists, symlink')) throw err;
      });
    }, { concurrency: 1});
  }, { concurrency: 1 });
  console.log('Successfully established symlinks.');

  console.log('Setup completed successfully, welcome to QUERY_CURVE development!');
}
