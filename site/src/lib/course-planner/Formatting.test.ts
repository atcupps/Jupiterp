import {
  splitCourseCode,
  formatInstructors,
} from './Formatting';

describe('splitCourseCode', () => {
  test('splits four-letter department code from course number', () => {
    expect(splitCourseCode('CMSC424')).toBe('CMSC 424');
  });

  test('handles different department prefixes', () => {
    expect(splitCourseCode('ENGL101')).toBe('ENGL 101');
  }); 
});

describe('formatInstructors', () => {
  test('formats a single instructor', () => {
    expect(formatInstructors(['John Doe'])).toBe('John Doe');
  });

  test('formats multiple instructors', () => {
    expect(formatInstructors(['John Doe', 'Jane Smith'])).toBe('John Doe, Jane Smith');
  });

  test('handles no instructors', () => {
    expect(formatInstructors([])).toBe('');
  });
});