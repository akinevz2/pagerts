import { LogStylePrinter } from '../printers/LogStylePrinter';

describe('LogStylePrinter security', () => {
  function hasForbiddenControlCharacters(input: string): boolean {
    return Array.from(input).some((char) => {
      const codePoint = char.codePointAt(0) ?? 0;
      if (codePoint === 10) return false; // printer uses newlines intentionally
      return (codePoint >= 0 && codePoint <= 31) || (codePoint >= 127 && codePoint <= 159);
    });
  }

  it('removes terminal control characters from rendered output', async () => {
    const writeSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true as ReturnType<typeof process.stdout.write>);

    const printer = new LogStylePrinter();
    await printer.print({
      title: 'safe\u001b[31m-title',
      url: 'https://example.com\u0007',
      resources: [
        {
          text: { key: 'id', value: 'name\r\nline' },
          link: { key: 'href', value: 'https://example.com/x\u001b[2J' },
        },
      ],
    });

    const rendered = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join('');
    expect(hasForbiddenControlCharacters(rendered)).toBe(false);

    writeSpy.mockRestore();
  });
});
