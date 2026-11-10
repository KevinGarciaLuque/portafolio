import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cvDownloadName, cleanOriginalName, looksLikePdf, isCvFileName } from '../src/cvName.js';

test('cvDownloadName quita tildes y símbolos', () => {
  assert.equal(cvDownloadName('Kevin García'), 'CV-Kevin-Garcia.pdf');
  assert.equal(cvDownloadName('  José  Ñandú / <x> '), 'CV-Jose-Nandu-x.pdf');
});

test('cvDownloadName tiene valor por defecto', () => {
  assert.equal(cvDownloadName(''), 'CV-curriculum.pdf');
  assert.equal(cvDownloadName(undefined), 'CV-curriculum.pdf');
  assert.equal(cvDownloadName('***'), 'CV-curriculum.pdf');
});

test('cleanOriginalName elimina rutas y caracteres peligrosos', () => {
  assert.equal(cleanOriginalName('C:\\Users\\kg\\Mi CV.pdf'), 'Mi CV.pdf');
  assert.equal(cleanOriginalName('../../etc/pass<wd>.pdf'), 'passwd.pdf');
  assert.equal(cleanOriginalName(''), 'cv.pdf');
  assert.ok(cleanOriginalName('a'.repeat(500) + '.pdf').length <= 120);
});

test('looksLikePdf exige la firma %PDF-', () => {
  assert.equal(looksLikePdf(Buffer.from('%PDF-1.7\n1 0 obj')), true);
  assert.equal(looksLikePdf(Buffer.from('GIF89a......')), false);
  assert.equal(looksLikePdf(Buffer.from('%PDF-')), false); // demasiado corto
  assert.equal(looksLikePdf('%PDF-1.7 texto'), false); // no es un Buffer
});

test('isCvFileName solo acepta nombres generados por la app', () => {
  assert.equal(isCvFileName('cv-0123456789abcdef01234567.pdf'), true);
  assert.equal(isCvFileName('../cv-0123456789abcdef01234567.pdf'), false);
  assert.equal(isCvFileName('cv-xyz.pdf'), false);
  assert.equal(isCvFileName(''), false);
});
