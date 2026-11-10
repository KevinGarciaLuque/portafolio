import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSlots } from '../src/slots.js';

const DAY = '2030-06-10';
const LONG_AGO = new Date('2020-01-01T00:00:00'); // nada ha pasado todavía
const rule = (start_time, end_time) => ({ start_time, end_time });

test('franja 09:00-17:00 genera 8 horarios de una hora', () => {
  const s = buildSlots(DAY, [rule('09:00', '17:00')], [], LONG_AGO);
  assert.deepEqual(s, ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']);
});

test('no genera un horario que no cabe completo en la franja', () => {
  assert.deepEqual(buildSlots(DAY, [rule('09:00', '10:30')], [], LONG_AGO), ['09:00']);
  assert.deepEqual(buildSlots(DAY, [rule('09:00', '09:45')], [], LONG_AGO), []);
});

test('acepta horas con segundos (formato de MySQL)', () => {
  assert.deepEqual(buildSlots(DAY, [rule('09:00:00', '11:00:00')], [], LONG_AGO), ['09:00', '10:00']);
});

test('quita los horarios ya ocupados (Set o arreglo)', () => {
  assert.deepEqual(buildSlots(DAY, [rule('09:00', '12:00')], new Set(['10:00']), LONG_AGO), ['09:00', '11:00']);
  assert.deepEqual(buildSlots(DAY, [rule('09:00', '12:00')], ['09:00', '11:00'], LONG_AGO), ['10:00']);
});

test('descarta los horarios que ya pasaron', () => {
  const now = new Date(`${DAY}T12:30:00`);
  assert.deepEqual(buildSlots(DAY, [rule('09:00', '15:00')], [], now), ['13:00', '14:00']);
});

test('un horario exactamente a la hora actual ya no está disponible', () => {
  const now = new Date(`${DAY}T10:00:00`);
  assert.deepEqual(buildSlots(DAY, [rule('09:00', '12:00')], [], now), ['11:00']);
});

test('franjas que se solapan no repiten horarios y salen ordenadas', () => {
  const s = buildSlots(DAY, [rule('11:00', '14:00'), rule('09:00', '12:00')], [], LONG_AGO);
  assert.deepEqual(s, ['09:00', '10:00', '11:00', '12:00', '13:00']);
});

test('sin franjas no hay horarios', () => {
  assert.deepEqual(buildSlots(DAY, [], [], LONG_AGO), []);
});

test('día completamente pasado no tiene horarios', () => {
  const now = new Date('2031-01-01T00:00:00');
  assert.deepEqual(buildSlots(DAY, [rule('09:00', '17:00')], [], now), []);
});
