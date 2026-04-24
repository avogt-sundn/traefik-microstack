'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { XMLParser } = require('fast-xml-parser');

const app = express();
const PORT = 3000;

const RESULTS_DIR = '/results';
const REPORT_DIR = '/report';
const SMOKE_XML = path.join(RESULTS_DIR, 'smoke.xml');
const PROJECT_COMPOSE = process.env.COMPOSE_FILE || '/project/docker-compose.yaml';
const PROJECT_NAME = process.env.COMPOSE_PROJECT_NAME || 'traefik-microstack';

let isRunning = false;

// Static files
app.use('/results', express.static(RESULTS_DIR, { index: false }));
app.use('/report', express.static(REPORT_DIR, { index: false }));
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/results — parse smoke.xml and return JSON
app.get('/api/results', (req, res) => {
  if (!fs.existsSync(SMOKE_XML)) {
    return res.json(null);
  }

  let xml;
  try {
    xml = fs.readFileSync(SMOKE_XML, 'utf8');
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read results file' });
  }

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  let doc;
  try {
    doc = parser.parse(xml);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse XML' });
  }

  // Normalize: fast-xml-parser returns an object; testsuites may wrap testsuite
  const root = doc.testsuites || doc;
  const rawSuite = root.testsuite;
  if (!rawSuite) {
    return res.json(null);
  }

  // Might be an array of suites or a single suite
  const suites = Array.isArray(rawSuite) ? rawSuite : [rawSuite];

  const testcases = [];
  let totalTests = 0, totalFailures = 0, totalErrors = 0, totalSkipped = 0, totalTime = 0;
  let suiteName = '';
  let timestamp = '';

  for (const suite of suites) {
    const attrs = suite;
    suiteName = suiteName || attrs['@_name'] || '';
    timestamp = timestamp || attrs['@_timestamp'] || '';
    totalTests += parseInt(attrs['@_tests'] || '0', 10);
    totalFailures += parseInt(attrs['@_failures'] || '0', 10);
    totalErrors += parseInt(attrs['@_errors'] || '0', 10);
    totalSkipped += parseInt(attrs['@_skipped'] || '0', 10);
    totalTime += parseFloat(attrs['@_time'] || '0');

    const rawCases = suite.testcase;
    if (!rawCases) continue;
    const cases = Array.isArray(rawCases) ? rawCases : [rawCases];

    for (const tc of cases) {
      let status = 'passed';
      let errorMessage = null;

      if (tc.failure) {
        status = 'failed';
        errorMessage = typeof tc.failure === 'string'
          ? tc.failure
          : (tc.failure['#text'] || tc.failure['@_message'] || 'Test failed');
      } else if (tc.error) {
        status = 'failed';
        errorMessage = typeof tc.error === 'string'
          ? tc.error
          : (tc.error['#text'] || tc.error['@_message'] || 'Test error');
      } else if (tc.skipped !== undefined) {
        status = 'skipped';
      }

      testcases.push({
        name: tc['@_name'] || '',
        classname: tc['@_classname'] || '',
        duration: parseFloat(tc['@_time'] || '0'),
        status,
        errorMessage,
      });
    }
  }

  res.json({
    suiteName,
    timestamp,
    totals: {
      tests: totalTests,
      passed: totalTests - totalFailures - totalErrors - totalSkipped,
      failed: totalFailures + totalErrors,
      skipped: totalSkipped,
      duration: totalTime,
    },
    testcases,
  });
});

// GET /api/status
app.get('/api/status', (req, res) => {
  res.json({ running: isRunning });
});

// POST /api/run — trigger test run via docker compose
app.post('/api/run', (req, res) => {
  if (isRunning) {
    return res.status(409).json({ error: 'A run is already in progress' });
  }

  isRunning = true;

  const args = [
    'compose',
    '-f', PROJECT_COMPOSE,
    '-p', PROJECT_NAME,
    'run', '--rm', 'e2e-tests',
  ];

  const child = spawn('docker', args, {
    detached: true,
    stdio: 'ignore',
  });

  child.on('close', () => {
    isRunning = false;
  });

  child.on('error', (err) => {
    console.error('Failed to start test run:', err.message);
    isRunning = false;
  });

  child.unref();

  res.json({ started: true });
});

app.listen(PORT, () => {
  console.log(`E2E report server listening on port ${PORT}`);
});
