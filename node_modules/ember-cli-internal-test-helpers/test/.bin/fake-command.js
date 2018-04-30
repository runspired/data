#!/usr/bin/env node

if (process.argv && process.argv[2] === '--version') {
  console.log('ok');
} else {
  throw new Error('error message');
}
