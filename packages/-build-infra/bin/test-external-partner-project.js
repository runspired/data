#!/usr/bin/env node

'use strict';
/* eslint-disable no-console, node/no-extraneous-require, node/no-unpublished-require */
const fs = require('fs');
const path = require('path');
const { shellSync } = require('execa');
// apparently violates no-extraneous require? /shrug
const debug = require('debug')('test-external');
const rimraf = require('rimraf');

const projectRoot = path.resolve(__dirname, '../');
const externalProjectName = process.argv[2];
const gitUrl = process.argv[3];
const skipSmokeTest = process.argv[4] && process.argv[4] === '--skip-smoke-test';
const cachePath = '../../../__external-test-cache';
const tempDir = path.join(projectRoot, cachePath);
const projectTempDir = path.join(tempDir, externalProjectName);

if (!gitUrl) {
  throw new Error(
    'No git url provided to `test-external-partner`. An https git url should be the first argument.'
  );
} else if (gitUrl.indexOf('https') !== 0) {
  throw new Error(
    `The git url provided to \`node test-external-partner\` should use https. Received '${gitUrl}'`
  );
}

console.log(
  `Preparing to test external project ${externalProjectName} located at ${gitUrl} against this ember-data commit.`
);

function execExternal(command, force) {
  command = `cd ${projectTempDir} && ${command}`;
  return execWithLog(command, force);
}

function execWithLog(command, force) {
  if (debug.enabled || force) {
    return shellSync(command, { stdio: [0, 1, 2] });
  }

  return shellSync(command);
}

if (!fs.existsSync(tempDir)) {
  debug(`Ensuring Cache Root at: ${tempDir}`);
  fs.mkdirSync(tempDir);
} else {
  debug(`Cache Root Exists at: ${tempDir}`);
}

if (fs.existsSync(projectTempDir)) {
  debug(`Cleaning Cache at: ${projectTempDir}`);
  rimraf.sync(projectTempDir);
} else {
  debug(`No pre-existing cache present at: ${projectTempDir}`);
}

// install the project
try {
  execWithLog(`git clone --depth=1 ${gitUrl} ${projectTempDir}`);
} catch (e) {
  debug(e);
  throw new Error(
    `Install of ${gitUrl} in ${projectTempDir} for external project ${externalProjectName} testing failed.`
  );
}

const useYarn = fs.existsSync(path.join(projectTempDir, 'yarn.lock'));

const npmLink = `
npm link;
cd ../adapter;
npm link @ember-data/-build-infra;
npm link;
cd ../store;
npm link @ember-data/-build-infra;
npm link @ember-data/adapter;
npm link;
cd ../serializer;
npm link @ember-data/-build-infra;
npm link @ember-data/store;
npm link;
cd ../model;
npm link @ember-data/-build-infra;
npm link @ember-data/store;
npm link;
cd ../-ember-data;
npm link @ember-data/-build-infra;
npm link @ember-data/adapter;
npm link @ember-data/store;
npm link @ember-data/serializer;
npm link @ember-data/model;
npm link;
`;
// install project dependencies and link our local version of ember-data
try {
  execWithLog(`${useYarn ? 'yarn link' : npmLink}`);
  execExternal(`${useYarn ? 'yarn' : 'npm install'}`);
} catch (e) {
  debug(e);
  throw new Error(
    `Unable to complete install of dependencies for external project ${externalProjectName}`
  );
}

// run project tests
console.log(`Running tests for ${externalProjectName}`);

let smokeTestPassed = true;
let commitTestPassed = true;

try {
  if (skipSmokeTest) {
    debug('Skipping Smoke Test');
  } else {
    debug('Running Smoke Test');
    execExternal(`ember test`, true);
  }
} catch (e) {
  smokeTestPassed = false;
}

try {
  execExternal(`${useYarn ? 'yarn link ember-data' : 'npm link ember-data'}`);
} catch (e) {
  debug(e);
  throw new Error(
    `Unable to \`${useYarn ? 'yarn' : 'npm'} link ember-data\` for ${externalProjectName}`
  );
}

try {
  debug('Running tests against EmberData commit');
  execExternal(`ember test`, true);
} catch (e) {
  commitTestPassed = false;
}

if (skipSmokeTest && !commitTestPassed) {
  throw new Error('Commit may result in a regression, but the smoke test was skipped.');
} else if (!smokeTestPassed && !commitTestPassed) {
  throw new Error(
    `Commit may result in a regression, but the smoke test for ${externalProjectName} also failed.`
  );
} else if (smokeTestPassed && !commitTestPassed) {
  throw new Error(`Commit results in a regression in ${externalProjectName}`);
} else if (!smokeTestPassed) {
  console.log(`Commit may resolve issues present in the smoke test for ${externalProjectName}`);
} else {
  console.log(`Commit does not regress ${externalProjectName}`);
}
