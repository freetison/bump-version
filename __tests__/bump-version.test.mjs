import { describe, it, expect } from 'vitest';

// ── Bump detection logic (pure, extracted for testing) ────────────────────────
const MAJOR_RE = /^(feat|fix|refactor)!|BREAKING CHANGE/;
const MINOR_RE = /^feat(\(.+\))?:/;

function detectBump(commits) {
  if (commits.some((c) => MAJOR_RE.test(c))) return 'major';
  if (commits.some((c) => MINOR_RE.test(c))) return 'minor';
  return 'patch';
}

function manualBump(version, bump) {
  const [maj, min, pat] = version.split('.').map(Number);
  if (bump === 'major') return `${maj + 1}.0.0`;
  if (bump === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

// ── detectBump tests ──────────────────────────────────────────────────────────
describe('detectBump', () => {
  it('returns patch for fix commits', () => {
    expect(detectBump(['fix: correct typo', 'chore: update deps'])).toBe('patch');
  });

  it('returns patch for chore/docs/refactor without bang', () => {
    expect(detectBump(['docs: update README', 'chore: ci config'])).toBe('patch');
  });

  it('returns minor for feat', () => {
    expect(detectBump(['feat: add dark mode', 'fix: button color'])).toBe('minor');
  });

  it('returns minor for feat with scope', () => {
    expect(detectBump(['feat(auth): add oauth support'])).toBe('minor');
  });

  it('returns major for feat!', () => {
    expect(detectBump(['feat!: redesign API'])).toBe('major');
  });

  it('returns major for fix!', () => {
    expect(detectBump(['fix!: breaking change in response format'])).toBe('major');
  });

  it('returns major for refactor!', () => {
    expect(detectBump(['refactor!: remove legacy endpoints'])).toBe('major');
  });

  it('returns major when BREAKING CHANGE appears in message', () => {
    expect(detectBump(['feat: new thing\n\nBREAKING CHANGE: old thing removed'])).toBe('major');
  });

  it('major wins over minor in mixed commits', () => {
    expect(detectBump(['feat: add feature', 'feat!: break everything'])).toBe('major');
  });

  it('returns patch for empty commits array', () => {
    expect(detectBump([])).toBe('patch');
  });
});

// ── manualBump tests ──────────────────────────────────────────────────────────
describe('manualBump', () => {
  it('bumps patch', () => expect(manualBump('1.2.3', 'patch')).toBe('1.2.4'));
  it('bumps minor and resets patch', () => expect(manualBump('1.2.3', 'minor')).toBe('1.3.0'));
  it('bumps major and resets minor+patch', () => expect(manualBump('1.2.3', 'major')).toBe('2.0.0'));
  it('handles 0.0.0', () => expect(manualBump('0.0.0', 'patch')).toBe('0.0.1'));
  it('handles double-digit versions', () => expect(manualBump('10.20.30', 'minor')).toBe('10.21.0'));
});
