import { answerQuery } from '../lib/voiceSearch';
import places from '../data/places.json';
import type { Place } from '../types';

const ctx = { loc: null, now: new Date('2026-11-27T10:00:00') };
const P = places as unknown as Place[];

describe('assistant understands Hindi', () => {
  it('finds a place named in Devanagari and answers the ticket price in Hindi', () => {
    const a = answerQuery('क़ुतुब मीनार का टिकट कितना है', P, ctx);
    expect(a.kind).toBe('place');
    expect(a.places[0].id).toBe('qutub-minar');
    expect(a.reply).toMatch(/[ऀ-ॿ]/);
    expect(a.reply).toMatch(/रुपये/);
  });
  it('lists free places in Hindi', () => {
    const a = answerQuery('मुफ़्त जगहें', P, ctx);
    expect(a.kind).toBe('list');
    expect(a.reply).toMatch(/जगह/);
  });
  it('replies to unclear Hindi in Hindi, not English', () => {
    const a = answerQuery('नहीं बोला ना', P, ctx);
    expect(a.kind).toBe('none');
    expect(a.reply).toMatch(/[ऀ-ॿ]/);
  });
  it('still answers English in English', () => {
    expect(answerQuery('Ticket price for Qutub Minar', P, ctx).reply).toMatch(/rupees/);
  });
});
